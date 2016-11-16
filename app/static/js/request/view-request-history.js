// initialize variables
var requestHistoryReloadIndex = 0; // index to keep track of number of events loaded, load 50 more events for every increment of 1
var requestHistoryIndex = 0; // index to keep track of which interval of events are shown
var requestHistory; // initialize variable to store list of events
var requestHistoryIndexShift = 5; // index number used to increment or decrement requestHistoryIndex

// hide load-more-history div
$(".load-more-history").hide();

// loads initial history into div
$(document).ready(function () {
    $.ajax({
        type: "POST",
        url: "/request/api/v1.0/history",
        data: {requestHistoryReloadIndex: requestHistoryReloadIndex},
        success: function (data) {
            requestHistory = data.requestHistory;
            var requestHistoryHtml = "<table class='table'> <tbody>";
            for (var i = requestHistoryIndex; i < requestHistoryIndex + requestHistoryIndexShift; i++) {
                requestHistoryHtml = requestHistoryHtml + "<tr> <td>" + requestHistory[i] + "</td> </tr>";
            }
            document.getElementById("request-history-table").innerHTML = requestHistoryHtml;
        },
        error: function (error) {
            console.log(error);
        }
    });
});

// replaces currently displayed history events with previous 5 history events
function previousHistory() {
    if (requestHistoryIndex !== 0) {
        requestHistoryIndex = requestHistoryIndex - requestHistoryIndexShift;
        var requestHistoryHtml = "<table class='table'> <tbody>";
        for (var i = requestHistoryIndex; i < requestHistoryIndex + requestHistoryIndexShift; i++) {
            requestHistoryHtml = requestHistoryHtml + "<tr> <td>" + requestHistory[i] + "</td> </tr>";
        }
        document.getElementById("request-history-table").innerHTML = requestHistoryHtml;
    }
    if (requestHistoryIndex === requestHistory.length - requestHistoryIndexShift) {
        $(".load-more-history").show();
    } else {
        $(".load-more-history").hide();
    }
}

// replaces currently displayed history events with next 5 history events
function nextHistory() {
    if (requestHistoryIndex !== requestHistory.length - requestHistoryIndexShift) {
        requestHistoryIndex = requestHistoryIndex + requestHistoryIndexShift;
        var requestHistoryHtml = "<table class='table'> <tbody>";
        for (var i = requestHistoryIndex; i < requestHistoryIndex + requestHistoryIndexShift; i++) {
            requestHistoryHtml = requestHistoryHtml + "<tr> <td>" + requestHistory[i] + "</td> </tr>";
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
function loadMoreHistory() {
    requestHistoryReloadIndex++;
    $.ajax({
        type: "POST",
        url: "/request/api/v1.0/history",
        data: {requestHistoryReloadIndex: requestHistoryReloadIndex},
        success: function (data) {
            requestHistory = data.requestHistory;
            var requestHistoryHtml = "<table class=> <tbody>";
            for (var i = requestHistoryIndex; i < requestHistoryIndex + requestHistoryIndexShift; i++) {
                requestHistoryHtml = requestHistoryHtml + "<tr> <td>" + requestHistory[i] + "</td> </tr>";
            }
            document.getElementById("request-history-table").innerHTML = requestHistoryHtml;
        },
        error: function (error) {
            console.log(error);
        }
    });
    $(".load-more-history").hide();
}