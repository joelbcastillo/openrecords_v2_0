"use strict";

function bindFileUpload(target,
                        requestId,
                        forUpdate,
                        uploadTemplateId,
                        downloadTemplateId,
                        nextButton) {
    /*
    Binds jquery file upload to the element identified by 'target'

    @param {string} target - jquery selector string (ex. "#fileupload")
    @param {string} requestId - FOIL request id
    @param {bool} forUpdate - editing a file?
    @param {string} uploadTemplateId - jquery file upload uploadTemplateId
    @param {string} downloadTemplateId - jquery file upload downloadTemplateId
    @param {selector} nextButton - jquery selector for next button of file response workflow
    */

    uploadTemplateId = uploadTemplateId || "template-upload";
    downloadTemplateId = downloadTemplateId || "template-download";

    $(target).fileupload({
        //xhrFields: {withCredentials: true},  // send cross-domain cookies
        url: "/upload/" + requestId,
        formData: forUpdate ? {update: true} : {},
        uploadTemplateId: uploadTemplateId,
        downloadTemplateId: downloadTemplateId,
        maxChunkSize: 512000,  // 512 kb
        maxFileSize: 500000000, // 500 mb
        chunksend: function (e, data) {
            // stop sending chunks if abort signaled
            if (data.context[0].abortChunkSend) {
                return false;
            }
        },
        chunkdone: function (e, data) {
            // on error, signal to stop sending chunks
            if (data.result) {
                if (data.result.files[0].error) {
                    data.context[0].abortChunkSend = true;
                    data.files[0].error = data.result.files[0].error
                }
            }
        },
        chunkfail: function (e, data) {
            // remove existing partial upload
            deleteUpload(requestId, encodeName(data.files[0].name), false, true);
        }
    }).bind("fileuploaddone", function (e, data) {
        // blueimp says that this will only be called on a successful upload
        // so I'm not sure why I have to check for errors here!
        var file = data.result.files[0];
        if (file.errors === undefined) {
            // start polling status endpoint after scanner startup
            var idVal = encodeName(file.name);
            data.result.files[0].identifier = idVal;
            setTimeout(
                pollUploadStatus.bind(null, file.name, idVal, requestId, forUpdate, nextButton),
                4000);  // McAfee Scanner minimum 3+ second startup
        }
        else {
            // Re-enable 'next' button
            if (forUpdate) {
                $(nextButton).attr('enabled', true);
            }
        }
    }).bind("fileuploadadd", function (e, data) {
        if (forUpdate) {
            // Replace added file OR Delete uploaded file
            var elemFiles = $(target).find(".files");
            var templatesUpload = elemFiles.children(".template-upload");
            var templatesDownload = elemFiles.children(".template-download");
            if (templatesUpload.length > 0) {
                templatesUpload.remove();
            }
            if (templatesDownload.length > 0) {
                for (var i = 0; i < templatesDownload.length; i++) {
                    var fileIdentifier = $(templatesDownload[i]).attr("id");
                    if (typeof fileIdentifier != "undefined") {
                        // if this template is for a successful upload
                        deleteUpload(requestId, fileIdentifier, true);
                    }
                    $(templatesDownload[i]).remove();
                }
            }
        }
        else {
            // Prevent duplicate files from being added
            var currentFiles = [];
            $(this).fileupload("option").filesContainer.children().each(function () {
                currentFiles.push($.trim($(".original-name", this).text()));
            });
            data.files = $.map(data.files, function (file, i) {
                if ($.inArray(file.name, currentFiles) >= 0) {
                    alert("The file '" + file.name + "' has already been added.");
                    return null;
                }
                return file;
            });
        }
        $(".fileupload-loading").hide();
        $(".fileupload-process").hide();
    }).bind("fileuploadstarted", function (e, data) {
        // Disable "next" button
        if (forUpdate) {
            $(nextButton).attr("disabled", true);
        }
    });
}

function encodeName(name) {
    /*
    Returns an encoded (base64 without padding) version of "name" intended
    for use as/in an html id attribute or for use in a url.
    Padding is removed because "=" is an invalid character for an html id
    and it is reserved character for urls.
     */
    return window.btoa(name).replace(/=/g, "");
}

function pollUploadStatus(uploadFilename, htmlId, requestId, forUpdate, nextButton) {
    /*
    Sends a request to the upload status endpoint
    every 2 seconds until it receives a message indicating
    the upload has completed or until it receives an error
    message, then updates the download template.
     */
    $.ajax({
        type: "GET",
        url: "/upload/status",
        data: {
            requestId: requestId,
            filename: uploadFilename,
            forUpdate: forUpdate
        },
        dataType: "json",
        success: function(response) {
            var tr = $("#".concat(htmlId));
            if (response.error) {
                // Reveal error message
                tr.find(".error-post-fileupload").removeClass("hidden");
                tr.find(".error-post-fileupload-msg").text("Error processing file.");  // scanning, really
                tr.find(".processing-upload").remove();
                setRemoveBtn(requestId, tr.find(".remove-post-fileupload"),
                    false);  // file already deleted
            }
            else if (response.status != "ready") {
                setTimeout(pollUploadStatus.bind(
                    null, uploadFilename, htmlId, requestId, forUpdate, nextButton
                ), 2000);
            }
            else {
                // Reveal full template
                tr.find(".fileupload-input-fields").removeClass("hidden");
                tr.find(".processing-upload").remove();
                setRemoveBtn(requestId, tr.find(".remove-post-fileupload"), true, forUpdate);
                if (forUpdate) {
                    // Enable "next" button
                    $(nextButton).attr("disabled", false)
                }
            }
        }
    });
}

function deleteUpload(requestId,
                      filecode,
                      updatedOnly,
                      quarantinedOnly) {
    /*
    Send a DELETE request to the upload endpoint.
     */
    var data = {};
    if (updatedOnly) {
        data = {updatedOnly: true}
    }
    else if (quarantinedOnly) {
        data = {quarantinedOnly: true}
    }

    $.ajax({
        type: "DELETE",
        url: sprintf("/upload/request/%s/%s",
            requestId, filecode),
        data: data
    });
}

function setRemoveBtn(requestId, button, sendDelete, forUpdate) {
    /*
    Reveal remove button and set its click event handler.
     */
    sendDelete = sendDelete || true;
    button.removeClass("hidden");
    button.click(function(e) {
        e.preventDefault();
        var template = $(this).closest(".template-download");
        if (sendDelete) {
            deleteUpload(requestId, template.attr("id"), forUpdate);
        }
        template.remove();
    });
}
