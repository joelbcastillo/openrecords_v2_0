"""
...module:: upload.views.

    :synopsis: Handles Upload endpoints for NYC OpenRecords
"""
import os

import app.lib.file_utils as fu

from flask import (
    request,
    jsonify,
    current_app,
)
from werkzeug.utils import secure_filename

from app import upload_redis as redis
from app.lib.utils import (
    b64decode_lenient,
    eval_request_bool,
)
from app.models import Responses
from app.constants import UPDATED_FILE_DIRNAME
from app.upload import upload
from app.upload.constants import (
    CONTENT_RANGE_HEADER,
    upload_status
)
from app.upload.utils import (
    parse_content_range,
    is_valid_file_type,
    scan_and_complete_upload,
    get_upload_key,
    upload_exists,
)


@upload.route('/<request_id>', methods=['POST'])
def post(request_id):
    """
    Create a new upload.

    Handles chunked files through the Content-Range header.
    For filesize validation and more upload logic, see:
        /static/js/plugins/jquery.fileupload-main.js

    Optional request body parameters:
    - update (bool)
        save the uploaded file to the 'updated' directory
        (this indicates the file is meant to replace
        a previously uploaded file)

    :returns: {
        "name": file name,
        "size": file size
    }
    """
    files = request.files
    file_ = files[next(files.keys())]
    filename = secure_filename(file_.filename)
    is_update = eval_request_bool(request.form.get('update'))
    if not is_update and upload_exists(request_id, filename):
        response = {
            "files": [{
                "name": filename,
                "error": "A file with this name has already "
                         "been uploaded for this request."
                # TODO: "link": <link-to-existsing-file> ? would be nice
            }]
        }
    else:
        upload_path = os.path.join(
            current_app.config['UPLOAD_QUARANTINE_DIRECTORY'],
            request_id)
        if not os.path.exists(upload_path):
            os.mkdir(upload_path)
        filepath = os.path.join(upload_path, filename)
        key = get_upload_key(request_id, filename, is_update)

        try:
            if CONTENT_RANGE_HEADER in request.headers:
                start, size = parse_content_range(
                    request.headers[CONTENT_RANGE_HEADER])

                # Only validate mime type on first chunk
                valid_file_type = True
                file_type = None
                if start == 0:
                    valid_file_type, file_type = is_valid_file_type(file_)

                if valid_file_type:
                    redis.set(key, upload_status.PROCESSING)
                    with open(filepath, 'ab') as fp:
                        fp.seek(start)
                        fp.write(file_.stream.read())
                    # scan if last chunk written
                    if os.path.getsize(filepath) == size:
                        scan_and_complete_upload.delay(request_id, filepath, is_update)
            else:
                valid_file_type, file_type = is_valid_file_type(file_)
                if valid_file_type:
                    redis.set(key, upload_status.PROCESSING)
                    file_.save(filepath)
                    scan_and_complete_upload.delay(request_id, filepath, is_update)

            if not valid_file_type:
                response = {
                    "files": [{
                        "name": filename,
                        "error": "The file type '{}' is not allowed.".format(
                            file_type)
                    }]
                }
            else:
                response = {
                    "files": [{
                        "name": filename,
                        "original_name": file_.filename,
                        "size": os.path.getsize(filepath),
                    }]
                }
        except Exception as e:
            redis.set(key, upload_status.ERROR)
            print("Upload for file '{}' failed: {}".format(filename, e))
            response = {
                "files": [{
                    "name": filename,
                    "error": "There was a problem uploading this file."
                }]
            }

    return jsonify(response), 200


@upload.route('/<r_id_type>/<r_id>/<filecode>', methods=['DELETE'])
def delete(r_id_type, r_id, filecode):
    """
    Removes an uploaded file.

    :param r_id_type: "response" or "request"
    :param r_id: the Response or Request identifier
    :param filecode: the encoded name of the uploaded file
        (base64 without padding)

    Optional request body parameters:
    - quarantined_only (bool)
        only delete the file if it is quarantined
        (beware: takes precedence over 'updated_only')
    - updated_only (bool)
        only delete the file if it is in the 'updated' directory

    :returns:
        On success:
            { "deleted": filename }
        On failure:
            { "error": error message }
    """
    # TODO: check current user request permissions
    filename = secure_filename(b64decode_lenient(filecode))
    if r_id_type not in ["request", "response"]:
        response = {"error": "Invalid ID type."}
    else:
        try:
            if r_id_type == "response":
                response = Responses.query.filter_by(id=r_id, deleted=False)
                r_id = response.request_id

            path = ''
            quarantined_only = eval_request_bool(request.form.get('quarantined_only'))
            if quarantined_only:
                path = os.path.join(
                    current_app.config['UPLOAD_QUARANTINE_DIRECTORY'],
                    r_id
                )
            elif eval_request_bool(request.form.get('updated_only')):
                path = os.path.join(
                    current_app.config['UPLOAD_DIRECTORY'],
                    r_id,
                    UPDATED_FILE_DIRNAME
                )
            else:
                path_for_status = {
                    upload_status.PROCESSING: current_app.config['UPLOAD_QUARANTINE_DIRECTORY'],
                    upload_status.SCANNING: current_app.config['UPLOAD_QUARANTINE_DIRECTORY'],
                    upload_status.READY: current_app.config['UPLOAD_DIRECTORY']
                }
                status = redis.get(get_upload_key(r_id, filename))
                if status is not None:
                    path = os.path.join(
                        path_for_status[status.decode("utf-8")],
                        r_id
                    )
            filepath = os.path.join(path, filename)
            found = False
            if path != '':
                if quarantined_only:
                    if os.path.exists(filepath):
                        os.remove(filepath)
                        found = True
                else:
                    if fu.exists(filepath):
                        fu.remove(filepath)
                        found = True
            if found:
                response = {"deleted": filename}
            else:
                response = {"error": "Upload not found."}
        except Exception as e:
            print("Error on DELETE /upload/: {}".format(e))
            response = {"error": "Failed to delete '{}'".format(filename)}

    return jsonify(response), 200


@upload.route('/status', methods=['GET'])
def status():
    """
    Check the status of an upload.

    Request Parameters:
        - request_id
        - filename
        - for_update (bool, optional)

    :returns: {
        "status": upload status
    }
    """
    try:
        status = redis.get(
            get_upload_key(
                request.args['request_id'],
                secure_filename(request.args['filename']),
                eval_request_bool(request.args.get('for_update'))
            )
        )
        if status is not None:
            response = {"status": status.decode("utf-8")}
        else:
            response = {"error": "Upload status not found."}
        status_code = 200
    except KeyError:
        response = {}
        status_code = 422

    return jsonify(response), status_code
