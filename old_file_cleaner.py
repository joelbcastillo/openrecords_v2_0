from app import create_app
from app.constants import UPDATED_FILE_DIRNAME
from app.models import Files
from flask import current_app
from datetime import datetime, timedelta
import os


def remove_files():
    upload_directory = current_app.config["UPLOAD_DIRECTORY"]
    searched_dir = UPDATED_FILE_DIRNAME
    curpath = os.path.abspath(os.walk(searched_dir))
    for dirpath, dirnames, filenames in upload_directory:
        if Files in filenames:
            file_modified = datetime.timestamp(os.path.getmtime(searched_dir))
            if datetime.now() - file_modified > timedelta(hours=24):
                os.remove(curpath)


def remove_quarantined_files():
    quarantine_directory = current_app.config["UPLOAD_QUARANTINE_DIRECTORY"]
    search_quarantine = os.path.abspath('/quarantine/data')
    curpath = os.path.abspath(os.walk(search_quarantine))
    for dirpath, dirnames, filenames in quarantine_directory:
        if Files in filenames:
            file_modified = datetime.timestamp(os.path.getmtime(search_quarantine))
            if datetime.now() - file_modified > timedelta(hours=24):
                os.remove(curpath)


def no_associated_response():
    if Files.query.filter_by(UPDATED_FILE_DIRNAME) is None:
        return None


if __name__ == "__main__":
    app = create_app('default')
    with app.app_context():
        remove_files()
