// initialize variables
var requestResponsesReloadIndex = 0; // index to keep track of number of responses loaded, load 50 more responses for every increment of 1
var requestResponsesIndex = 0; // index to keep track of which interval of responses are shown
var requestResponses; // initialize variable to store list of responses
var requestResponsesIndexShift = 10; // index number used to increment or decrement requestResponsesIndex
var responses = null;
var index = 0;
var indexIncrement = 10;

var requestId = $("#request-id").text();

// get first set of responses on page load
$.ajax({
    url: "/request/api/v1.0/responses",
    data: {requestResponsesReloadIndex: requestResponsesReloadIndex},
    success: function (data) {
        requestResponses = data.requestResponses;
        var requestResponsesHtml = "<table class='table'> <tbody>";
        for (var i = requestResponsesIndex; i < requestResponsesIndex + requestResponsesIndexShift; i++) {
            requestResponsesHtml = requestResponsesHtml + "<tr> <td>" + requestResponses[i] + "<button style='float: right;' type='button' class='btn btn-secondary btn-sm'>Edit</button> </td> </tr>";
        }
        document.getElementById("request-responses-table").innerHTML = requestResponsesHtml;
    },
    error: function (error) {
        console.log(error);
    }
});

// replaces currently displayed responses with previous 10 responses
function previousResponses() {
    if (requestResponsesIndex != 0) {
        requestResponsesIndex = requestResponsesIndex - requestResponsesIndexShift;
        var requestResponsesHtml = "<table class='table'> <tbody>";
        for (var i = requestResponsesIndex; i < requestResponsesIndex + requestResponsesIndexShift; i++) {
            requestResponsesHtml = requestResponsesHtml + "<tr> <td>" + requestResponses[i] + "<button style='float: right;' type='button' class='btn btn-secondary btn-sm'>Edit</button> </td> </tr>";
        }
        document.getElementById("request-responses-table").innerHTML = requestResponsesHtml;
    }
    if (requestResponsesIndex === requestResponses.length - requestResponsesIndexShift) {
        $(".load-more-responses").show();
    } else {
        $(".load-more-responses").hide();
    }
}

// replaces currently displayed responses with next 10 responses
function nextResponses() {
    if (requestResponsesIndex !== requestResponses.length - requestResponsesIndexShift) {
        requestResponsesIndex = requestResponsesIndex + requestResponsesIndexShift;
        var requestResponsesHtml = "<table class='table'> <tbody>";
        for (var i = requestResponsesIndex; i < requestResponsesIndex + requestResponsesIndexShift; i++) {
            requestResponsesHtml = requestResponsesHtml + "<tr> <td>" + requestResponses[i] + "<button style='float: right;' type='button' class='btn btn-secondary btn-sm'>Edit</button> </td> </tr>";
        }
        document.getElementById("request-responses-table").innerHTML = requestResponsesHtml;
    }

    if (requestResponsesIndex == requestResponses.length - requestResponsesIndexShift) {
        $(".load-more-responses").show();
    } else {
        $(".load-more-responses").hide();
    }
}

// loads 50 more responses into requestResponses array
function loadMoreResponses() {
    requestResponsesReloadIndex++;
    $.ajax({
        type: "POST",
        url: "/request/api/v1.0/responses",
        data: {requestResponsesReloadIndex: requestResponsesReloadIndex},
        success: function (data) {
            requestResponses = data.requestResponses;
            var requestResponsesHtml = "<table class='table'> <tbody>";
            for (var i = requestResponsesIndex; i < requestResponsesIndex + requestResponsesIndexShift; i++) {
                requestResponsesHtml = requestResponsesHtml + "<tr> <td>" + requestResponses[i] + "<button style='float: right;' type='button' class='btn btn-secondary btn-sm'>Edit</button> </td> </tr>";
            }
            document.getElementById("request-responses-table").innerHTML = requestResponsesHtml;
        },
        error: function (error) {
            console.log(error);
        }
    });
}

var navButtons = $("#responses-nav-buttons");

// replaces currently displayed responses with previous 10 responses
navButtons.find(".prev").click(function () {
    if (index !== 0) {
        index -= indexIncrement;
        showResponses();
    }
});

// replaces currently displayed responses with next 10 responses
navButtons.find(".next").click(function () {
    index += indexIncrement;
    if (index == responses.length - indexIncrement) {
        loadMoreResponses();
    }
    if (responses.length < index) {
        index -= indexIncrement;
    }
    showResponses();
});

// TODO: DELETE "updated" on modal close and reset / refresh page (wait until all responses ready)

function setEditResponseWorkflow(responseId, responseType) {
    // FIXME: if responseType does not need email workflow, some of these elements won"t be found!

    var responseModal = $("#response-modal-" + responseId);

    var first = responseModal.find(".first");
    var second = responseModal.find(".second");
    var third = responseModal.find(".third");

    var next1 = first.find(".response-modal-next");
    var next2 = second.find(".response-modal-next");
    var prev2 = second.find(".response-modal-prev");
    var prev3 = third.find(".response-modal-prev");

    var submitBtn = third.find(".response-modal-submit");

    // Initialize tinymce HTML editor
    tinymce.init({
        menubar: false,
        // sets tinymce to enable only on specific textareas classes
        mode: "specific_textareas",
        // selector for tinymce textarea classes is set to "tinymce-area"
        editor_selector: "tinymce-area",
        elementpath: false,
        height: 180
    });

    switch (responseType) {
        case "files":  // TODO: constants?
            next1.click(function (e) {
                // Validate fileupload form
                first.find(".fileupload-form").parsley().validate();

                // Do not proceed if file upload has not been completed
                if (first.find(".template-download").length === 0 &&
                    first.find(".template-upload").length !== 0) {
                    first.find(".fileupload-error-messages").text(
                        "The file upload has not been completed").show();
                    e.preventDefault();
                    return false;
                }

                // Do not proceed if files with error are not removed
                if (first.find(".upload-error").length > 0 ||
                    first.find(".error-post-fileupload").is(":visible")) {
                    first.find(".fileupload-error-messages").text(
                        "Files with Errors must be removed").show();
                    e.preventDefault();
                    return false;
                }

                if (first.find(".fileupload-form").parsley().isValid()) {
                    first.hide();
                    second.show();

                    $.ajax({
                        url: "/response/email",
                        type: "POST",
                        data: {
                            request_id: requestId,
                            template_name: "email_response_file.html",
                            type: "files"
                        },
                        success: function (data) {
                            // Data should be html template page.
                            tinyMCE.get("email-content-" + responseId).setContent(data.template);
                        }
                    });
                }
            });

            next2.click(function () {
                second.hide();
                third.show();

                tinyMCE.triggerSave();

                var filename = first.find(".secured-name").text();
                if (filename === "") {
                    filename = first.find(".uploaded-filename").text();
                }
                var privacy = first.find("input[name=privacy]:checked").val();

                var files = [{
                    "filename": filename,
                    "privacy": privacy
                }];

                $.ajax({
                    url: "/response/email",
                    type: "POST",
                    data: {
                        request_id: requestId,
                        template_name: "email_response_file.html",
                        type: "files",
                        files: JSON.stringify(files),
                        email_content: $("#email-content-" + responseId).val()
                    },
                    success: function (data) {
                        // Data should be html template page.
                        third.find(".email-summary").html(data.template);
                        // TODO: data should also return email confirmation header
                    }
                });
            });

            prev2.click(function () {
                first.find(".fileupload-error-messages").hide();
                second.hide();
                first.show();
            });

            prev3.click(function () {
                third.hide();
                second.show();
            });

            // SUBMIT!
            submitBtn.click(function () {
                $(this).attr("disabled", true);
                var form = first.find("form");
                $.ajax({
                    url: "/response/" + responseId,
                    type: "PATCH",
                    data: form.serializeArray(), // TODO: remove hidden email summaries
                    success: function () {
                        location.reload();
                    }
                });
            });

            // Apply parsley required validation for title
            first.find("input[name=title]").attr("data-parsley-required", "");
            first.find("input[name=title]").attr("data-parsley-errors-container", ".title-error");

            break;

        case "notes":
            next1.click(function () {
                first.find(".note-form").parsley().validate();

                if (first.find(".note-form").parsley().isValid()) {
                    $.ajax({
                        url: "/response/email",
                        type: "POST",
                        data: {
                            request_id: requestId,
                            template_name: "email_edit_response.html",
                            type: "edit",
                            response_id: responseId,
                            content: first.find(".note-content").val(),
                            privacy: first.find("input[name=privacy]:checked").val(),
                            confirmation: false
                        },
                        success: function (data) {
                            if (data.error) {
                                first.find(".note-error-messages").text(
                                    data.error).show();
                            }
                            else {
                                first.hide();
                                second.show();
                                first.find(".note-error-messages").text(
                                    data.error).hide();
                                tinyMCE.get("email-content-" + responseId).setContent(data.template);
                            }
                        }
                    });
                }
            });

            next2.click(function () {
                second.hide();
                third.show();

                tinyMCE.triggerSave();

                $.ajax({
                    url: "/response/email",
                    type: "POST",
                    data: {
                        request_id: requestId,
                        template_name: "email_edit_response.html",
                        type: "edit",
                        response_id: responseId,
                        content: first.find(".note-content").val(),
                        privacy: first.find("input[name=privacy]:checked").val(),
                        confirmation: true,
                        email_content: $("#email-content-" + responseId).val()
                    },
                    success: function (data) {
                        third.find(".confirmation-header").text(data.header);
                        third.find(".email-summary").html(data.template);
                    }
                });
            });

            prev2.click(function () {
                second.hide();
                first.show();
            });

            prev3.click(function () {
                third.hide();
                second.show();
            });

            // SUBMIT!
            submitBtn.click(function () {
                $(this).attr("disabled", true);
                var form = first.find("form");
                $.ajax({
                    url: "/response/" + responseId,
                    type: "PATCH",
                    data: form.serializeArray(),
                    success: function (response) {
                        location.reload();
                    }
                });
            });

            // Apply parsley data required validation to note content
            first.find(".note-content").attr("data-parsley-required", "");

            // Apply parsley max length validation to note content
            first.find(".note-content").attr("data-parsley-maxlength", "500");

            // Apply custom validation messages
            first.find(".note-content").attr("data-parsley-required-message",
                "Note content must be provided");
            first.find(".note-content").attr("data-parsley-maxlength-message",
                "Note content must be less than 500 characters");

            $(first.find(".note-content")).keyup(function () {
                characterCounter(first.find(".note-content-character-count"), 500, $(this).val().length);
            });

            break;

        // TODO: call common function, stop copying code
        case "instructions":
            next1.click(function () {
                first.find(".instruction-form").parsley().validate();

                if (first.find(".instruction-form").parsley().isValid()) {
                    $.ajax({
                        url: "/response/email",
                        type: "POST",
                        data: {
                            request_id: requestId,
                            template_name: "email_edit_response.html",
                            type: "edit",
                            response_id: responseId,
                            content: first.find(".instruction-content").val(),
                            privacy: first.find("input[name=privacy]:checked").val(),
                            confirmation: false
                        },
                        success: function (data) {
                            if (data.error) {
                                first.find(".instruction-error-messages").text(
                                    data.error).show();
                            }
                            else {
                                first.hide();
                                second.show();
                                first.find(".instruction-error-messages").text(
                                    data.error).hide();
                                tinyMCE.get("email-content-" + responseId).setContent(data.template);
                            }
                        }
                    });
                }
            });

            next2.click(function () {
                second.hide();
                third.show();

                tinyMCE.triggerSave();

                $.ajax({
                    url: "/response/email",
                    type: "POST",
                    data: {
                        request_id: requestId,
                        template_name: "email_edit_response.html",
                        type: "edit",
                        response_id: responseId,
                        content: first.find(".instruction-content").val(),
                        privacy: first.find("input[name=privacy]:checked").val(),
                        confirmation: true,
                        email_content: $("#email-content-" + responseId).val()
                    },
                    success: function (data) {
                        third.find(".confirmation-header").text(data.header);
                        third.find(".email-summary").html(data.template);
                    },
                    error: function (error) {
                        console.log(error);
                    }
                });
            });

            prev2.click(function () {
                second.hide();
                first.show();
            });

            prev3.click(function () {
                third.hide();
                second.show();
            });

            // SUBMIT!
            submitBtn.click(function () {
                $(this).attr("disabled", true);
                var form = first.find("form");
                $.ajax({
                    url: "/response/" + responseId,
                    type: "PATCH",
                    data: form.serializeArray(),
                    success: function (response) {
                        location.reload();
                    }
                });
            });

            // Apply parsley data required validation to instructions content
            first.find(".instruction-content").attr("data-parsley-required", "");

            // Apply parsley max length validation to instructions content
            first.find(".instruction-content").attr("data-parsley-maxlength", "500");

            // Apply custom validation messages
            first.find(".instruction-content").attr("data-parsley-required-message",
                "Instruction content must be provided");
            first.find(".instruction-content").attr("data-parsley-maxlength-message",
                "Instruction content must be less than 500 characters");

            $(first.find(".instruction-content")).keyup(function () {
                characterCounter(first.find(".instruction-content-character-count"), 500, $(this).val().length);
            });

            break;

        case "links":
            first.find("input[name='url'']").on("input", function () {
                var urlVal = $(this).val();
                first.find(".edit-link-href").attr("href", urlVal).text(urlVal);
            });

            next1.click(function () {
                first.find(".link-form").parsley().validate();

                if (first.find(".link-form").parsley().isValid()) {
                    $.ajax({
                        url: "/response/email",
                        type: "POST",
                        data: {
                            request_id: requestId,
                            template_name: "email_edit_response.html",
                            type: "edit",
                            response_id: responseId,
                            title: first.find(".title").val(),
                            url: first.find(".url").val(),
                            privacy: first.find("input[name=privacy]:checked").val(),
                            confirmation: false
                        },
                        success: function (data) {
                            if (data.error) {
                                first.find(".link-error-messages").text(
                                    data.error).show();
                            }
                            else {
                                first.hide();
                                second.show();
                                first.find(".link-error-messages").text(
                                    data.error).hide();
                                tinyMCE.get("email-content-" + responseId).setContent(data.template);
                            }
                        }
                    });
                }
            });

            next2.click(function () {
                second.hide();
                third.show();

                tinyMCE.triggerSave();

                $.ajax({
                    url: "/response/email",
                    type: "POST",
                    data: {
                        request_id: requestId,
                        template_name: "email_edit_response.html",
                        type: "edit",
                        response_id: responseId,
                        title: first.find(".title").val(),
                        url: first.find(".url").val(),
                        privacy: first.find("input[name=privacy]:checked").val(),
                        confirmation: true,
                        email_content: $("#email-content-" + responseId).val()
                    },
                    success: function (data) {
                        third.find(".confirmation-header").text(data.header);
                        third.find(".email-summary").html(data.template);
                    }
                });
            });

            prev2.click(function () {
                second.hide();
                first.show();
            });

            prev3.click(function () {
                third.hide();
                second.show();
            });

            // SUBMIT!
            submitBtn.click(function () {
                $(this).attr("disabled", true);
                var form = first.find("form");
                $.ajax({
                    url: "/response/" + responseId,
                    type: "PATCH",
                    data: form.serializeArray(),
                    success: function (response) {
                        location.reload();
                    }
                });
            });

            // Apply parsley data required validation to link-form fields
            first.find(".title").attr("data-parsley-required", "");
            first.find(".url").attr("data-parsley-required", "");

            // Apply parsley max length validation to link-form fields
            first.find(".title").attr("data-parsley-maxlength", "90");
            first.find(".url").attr("data-parsley-required", "254");

            // Apply custom validation messages
            first.find(".title").attr("data-parsley-required-message", "Link title must be provided.");
            first.find(".url").attr("data-parsley-required-message", "URL link must be provided.");
            first.find(".title").attr("data-parsley-maxlength-message", "Link title must be less than 90 characters.");
            first.find(".url").attr("data-parsley-maxlength-message", "URL link must be less than 254 characters.");

            // Custom validator to validate strict url using regexUrlChecker
            first.find(".url").attr("data-parsley-urlstrict", "");

            // Set character counter for link title
            first.find(".title").keyup(function () {
                characterCounter(first.find(".link-title-character-count"), 90, $(this).val().length);
            });

            // Set character counter for link url
            first.find(".url").keyup(function () {
                characterCounter(first.find(".link-url-character-count"), 254, $(this).val().length);
            });

            break;

        default:
            break;
    }
}

function setDeleteResponseWorkflow(responseId) {
    var responseModal = $("#response-modal-" + responseId);
    var deleteSection = responseModal.find(".delete");
    var defaultSection = responseModal.find(".default");

    var deleteConfirmCheck = responseModal.find("input[name=delete-confirm-string]");
    var deleteConfirm = responseModal.find(".delete-confirm");

    deleteConfirmCheck.on("paste", function (e) {
        e.preventDefault();
    });

    var deleteConfirmString = sprintf("%s:%s", request_id, responseId);
    deleteConfirmCheck.on("input", function () {
        if ($(this).val() === deleteConfirmString) {
            deleteConfirm.attr("disabled", false);
        }
        else {
            deleteConfirm.attr("disabled", true);
        }
    });

    responseModal.find(".delete-select").click(function () {
        defaultSection.hide();
        deleteSection.show();
    });

    responseModal.find(".delete-cancel").click(function () {
        deleteSection.hide();
        defaultSection.show();

        deleteConfirmCheck.val("");
    });

    responseModal.find(".delete-confirm").click(function () {
        deleteConfirm.attr("disabled", true);
        $.ajax({
            url: "/response/" + responseId,
            type: "PATCH",
            data: {
                deleted: true,
                confirmation: deleteConfirmCheck.val()
            },
            success: function () {
                location.reload();
            },
            error: function (error) {
                console.log(error);
            }
        })
    });
}

