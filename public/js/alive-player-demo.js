var m_lastdata = {
    "isStreaming": false,
    "playbackUrl": ""
};

function onLoadPage() {

    setInterval(checkForEvent, 3000);
}

function checkForEvent () {
    var url = "/getdata";

    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'json',
        timeout: 15000,
        headers: {
            'Content-Type': 'application/json'
        },
        data: "",
        success: function(data) {
            if ( ("isStreaming" in data) && ("playbackUrl" in data) && ("eventName" in data) ) {
                if (needUpdate(data) == true) {
                    if (data.isStreaming === true) {
                        var jobId = "";
                        if ("jobId" in data)
                            jobId = data.jobId;

                        setEventName(data.eventName, jobId);
                        setEventJobState("Running");
                        loadVideo(data.playbackUrl, true);
                    }
                    else {
                        setEventName("Name", "jobId");
                        setEventJobState("WAITING");
                        unloadVideo();
                    }
                    m_lastdata = data;
                }

            }
        },
        error: function(msg) {
            console.error("Error:" + msg);
        }
    });
}

function needUpdate (data) {
    var ret = false;

    if ( (data.playbackUrl != m_lastdata.playbackUrl) || (data.isStreaming != m_lastdata.isStreaming) )
        ret = true;

    return ret;
}

function setEventName (name, jobId) {
    var str = name + " (" + jobId + ")";
    document.getElementById("eventName").innerHTML = str;
}

function setEventJobState (state) {
    document.getElementById("jobState").innerHTML = state;
}

function loadVideo(url, play) {

    player.src({
        type: "application/x-mpegURL",
        src: url
    });
    console.log("Loaded playlist: " + url);

    if (play == true) {
        player.play();
        console.log("Play!");
    }
    else {
        player.pause();
    }
}

function unloadVideo() {

    console.log("unload playlist");

    player.pause();
}
