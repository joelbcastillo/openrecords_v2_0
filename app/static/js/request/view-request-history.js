// initialize variables
var requestHistory_reload_index = 0; // index to keep track of number of events loaded, load 50 more events for every increment of 1
var requestHistoryIndex = 0; // index to keep track of which interval of events are shown
var requestHistory; // initialize variable to store list of events
var requestHistoryIndexShift = 5; // index number used to increment or decrement requestHistoryIndex

// hide load-more-history div
$(".load-more-history").hide();

// loads initial history into div
$(document).ready(function () {
    $.ajax({
        type: "POST",
        url: '/request/api/v1.0/history',
        data: {requestHistory_reload_index: requestHistory_reload_index},
        success: function (data) {
            requestHistory = data.requestHistory;
            var requestHistoryHtml = '<table class="table"> <tbody>';
            for (var i = requestHistoryIndex; i < requestHistoryIndex + requestHistoryIndexShift; i++) {
                requestHistoryHtml = requestHistoryHtml + '<tr> <td>' + requestHistory[i] + '</td> </tr>';
            }
            document.getElementById("request-history-table").innerHTML = requestHistoryHtml;
        },
        error: function (error) {
            console.log(error);
        }
    });
});

// replaces currently displayed history events with previous 5 history events
function previous_history() {
    if (requestHistoryIndex != 0) {
        requestHistoryIndex = requestHistoryIndex - requestHistoryIndexShift;
        var requestHistoryHtml = '<table class="table"> <tbody>';
        for (var i = requestHistoryIndex; i < requestHistoryIndex + requestHistoryIndexShift; i++) {
            requestHistoryHtml = requestHistoryHtml + '<tr> <td>' + requestHistory[i] + '</td> </tr>';
        }
        document.getElementById("request-history-table").innerHTML = requestHistoryHtml;
    }
    if (requestHistoryIndex == requestHistory.length - requestHistoryIndexShift) {
        $(".load-more-history").show();
    } else {
        $(".load-more-history").hide();
    }
}

// replaces currently displayed history events with next 5 history events
function next_history() {
    if (requestHistoryIndex != requestHistory.length - requestHistoryIndexShift) {
        requestHistoryIndex = requestHistoryIndex + requestHistoryIndexShift;
        var requestHistoryHtml = '<table class="table"> <tbody>';
        for (var i = requestHistoryIndex; i < requestHistoryIndex + requestHistoryIndexShift; i++) {
            requestHistoryHtml = requestHistoryHtml + '<tr> <td>' + requestHistory[i] + '</td> </tr>';
        }
        document.getElementById("request-history-table").innerHTML = requestHistoryHtml;
    }
    if (requestHistoryIndex == requestHistory.length - requestHistoryIndexShift) {
        $(".load-more-history").show();
    } else {
        $(".load-more-history").hide();
    }
}

// loads 50 more history events into requestHistory array
function load_more_history() {
    requestHistory_reload_index++;
    $.ajax({
        type: "POST",
        url: '/request/api/v1.0/history',
        data: {requestHistory_reload_index: requestHistory_reload_index},
        success: function (data) {
            requestHistory = data.requestHistory;
            var requestHistoryHtml = '<table class="table"> <tbody>';
            for (var i = requestHistoryIndex; i < requestHistoryIndex + requestHistoryIndexShift; i++) {
                requestHistoryHtml = requestHistoryHtml + '<tr> <td>' + requestHistory[i] + '</td> </tr>';
            }
            document.getElementById("request-history-table").innerHTML = requestHistoryHtml;
        },
        error: function (error) {
            console.log(error);
        }
    });
    $(".load-more-history").hide();
}