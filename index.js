/**
 * Created by jcenzano on 3/19/17.
 */

const fs = require('fs');

var bodyParser = require('body-parser');

const PORT = 8080;
const LOCAL_DATA_FILENAME = 'eventdata.json';

var express = require('express');
var app = express();

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

//Serve static from public
app.use(express.static('public'));

app.get('/getdata', function (req, res) {

   readLocalData(LOCAL_DATA_FILENAME, function(err, data) {

      //Do not take into account the error

       res.send(data);
   });
});

app.post('/setdata', function(req, res) {

    var data = processNotification(req.body);

    if (data != null) {
        writeLocalData(LOCAL_DATA_FILENAME, data, function(err) {
            if (err)
                return next(err);

            res.send({status: "ok"});
        });
    }
    else {
        res.send({status: "ok"});
    }

});

//For all other routes return 404 (this should be the last routing line)
app.get('*', function (req, res, next) {

    var err = new Error();
    err.status = 404;
    err.message = "Resource not found: " + req.originalUrl;

    return next(err);
});

//Handle Errors
app.use(function (error, req, res, next) {
    var ret_status = error.status || 500;
    var ret_str_msg = error.message || '500: Internal Server Error. ' + JSON.stringify(error);

    resAddCORSopenGet(res);
    resAddNoCache(res);

    // respond with json
    if (req.accepts('json')) {
        var err = {
            status: ret_status,
            message: ret_str_msg
        };

        return res.status(ret_status).send(err);
    }
    else {
        return res.status(ret_status).send('500: Internal Server Error. ' + ret_str_msg);
    }
});

app.use(function (req, res, next) {
    resAddCORSopenGet(res);
    resAddNoCache(res);

    return next();
});

app.listen(PORT, function () {
    console.log('Listening on port:' + PORT);
});

function resAddNoCache(res) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
}

function resAddCORSopenGet(res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
}

function readLocalData (filename, callback) {
    var ret_data = {
        eventName: "",
        jobId: "",
        isStreaming: false,
        playbackUrl: ""
    };

   //Check if the file exists
    fs.stat(filename, function (err, stats) {
        if (err)
            return callback (err, ret_data);

        if (!stats.isFile())
            return callback (err, ret_data);

        //Read the file
        fs.readFile(filename, function (err, data) {
            if (err)
                return callback (err, ret_data);

            ret_data = JSON.parse(data);
            return callback ("", ret_data);
        });

    });
}

function writeLocalData(filename, data, callback) {

   fs.writeFile(filename, JSON.stringify(data), function (err) {
        if (err)
            return callback (err);

        return callback ("");
    });
}

function processNotification(data) {
    var ret_data = null;

    console.log("Notification received: " + JSON.stringify(data));

    if ( ("event" in data) && (data.event === "first_segment_uploaded") && ("job" in data) && ("playback_url" in data.job) ) {
        ret_data = {
            "eventName": "",
            "jobId": "",
            "isStreaming": true,
            "playbackUrl": data.job.playback_url
        };

        if ("pass_through" in data.job)
            ret_data.eventName = data.job.pass_through;

        if ("id" in data.job)
            ret_data.jobId = data.job.id;

        console.log("Start streaming: " + JSON.stringify(ret_data));

    } else if ( ("event" in data) && (data.event === "output_finished") ) {
        ret_data = {
            "eventName": "",
            "jobId": "",
            "isStreaming": false,
            "playbackUrl": ""
        };

        console.log("Stop streaming: " + JSON.stringify(ret_data));
    }

    return ret_data;
}