// initialize variables
var requestResponsesReloadIndex = 0; // index to keep track of number of responses loaded, load 50 more responses for every increment of 1
var requestResponsesIndex = 0; // index to keep track of which interval of responses are shown
var requestResponses; // initialize variable to store list of responses
var requestResponsesIndexShift = 10; // index number used to increment or decrement requestResponsesIndex

// hide load-more-responses div
$(".load-more-responses").hide();

// loads initial responses into div
$(document).ready(function () {
    $.ajax({
        type: "POST",
        url: '/request/api/v1.0/responses',
        data: {requestResponsesReloadIndex: requestResponsesReloadIndex},
        success: function (data) {
            requestResponses = data.requestResponses;
            var requestResponsesHtml = '<table class="table"> <tbody>';
            for (var i = requestResponsesIndex; i < requestResponsesIndex + requestResponsesIndexShift; i++) {
                requestResponses_html = requestResponses_html + '<tr> <td>' + requestResponses[i] + '<button style="float: right;" type="button" class="btn btn-secondary btn-sm">Edit</button> </td> </tr>';
            }
            document.getElementById("request-responses-table").innerHTML = requestResponses_html;
        },
        error: function (error) {
            console.log(error);
        }
    });
});

// replaces currently displayed responses with previous 10 responses
function previousResponses() {
    if (requestResponsesIndex != 0) {
        requestResponsesIndex = requestResponsesIndex - requestResponsesIndexShift;
        var requestResponses_html = '<table class="table"> <tbody>';
        for (var i = requestResponsesIndex; i < requestResponsesIndex + requestResponsesIndexShift; i++) {
            requestResponses_html = requestResponses_html + '<tr> <td>' + requestResponses[i] + '<button style="float: right;" type="button" class="btn btn-secondary btn-sm">Edit</button> </td> </tr>';
        }
        document.getElementById("request-responses-table").innerHTML = requestResponses_html;
    }
    if (requestResponsesIndex == requestResponses.length - requestResponsesIndexShift) {
        $(".load-more-responses").show();
    } else {
        $(".load-more-responses").hide();
    }
}

// replaces currently displayed responses with next 10 responses
function next_responses() {
    if (requestResponsesIndex != requestResponses.length - requestResponsesIndexShift) {
        requestResponsesIndex = requestResponsesIndex + requestResponsesIndexShift;
        var requestResponses_html = '<table class="table"> <tbody>';
        for (var i = requestResponsesIndex; i < requestResponsesIndex + requestResponsesIndexShift; i++) {
            requestResponses_html = requestResponses_html + '<tr> <td>' + requestResponses[i] + '<button style="float: right;" type="button" class="btn btn-secondary btn-sm">Edit</button> </td> </tr>';
        }
        document.getElementById("request-responses-table").innerHTML = requestResponses_html;
    }
    if (requestResponsesIndex == requestResponses.length - requestResponsesIndexShift) {
        $(".load-more-responses").show();
    } else {
        $(".load-more-responses").hide();
    }
}

// loads 50 more responses into requestResponses array
function load_more_responses() {
    requestResponsesReloadIndex++;
    $.ajax({
        type: "POST",
        url: '/request/api/v1.0/responses',
        data: {requestResponsesReloadIndex: requestResponsesReloadIndex},
        success: function (data) {
            requestResponses = data.requestResponses;
            var requestResponses_html = '<table class="table"> <tbody>';
            for (var i = requestResponsesIndex; i < requestResponsesIndex + requestResponsesIndexShift; i++) {
                requestResponses_html = requestResponses_html + '<tr> <td>' + requestResponses[i] + '<button style="float: right;" type="button" class="btn btn-secondary btn-sm">Edit</button> </td> </tr>';
            }
            document.getElementById("request-responses-table").innerHTML = requestResponses_html;
        },
        error: function (error) {
            console.log(error);
        }
    });
    $(".load-more-responses").hide();
}