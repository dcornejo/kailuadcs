#!/usr/bin/env node

//
// DCS Logger Task
//

"use strict";

let debugMe = false;

let sprintf = require("sprintf-js").sprintf;

// TODO: receive commands from tablet channel

let packageInfo = require('./package.json');
console.log('Data Collection Server v' + packageInfo.version);

const fs = require('fs');
let getopt = require('node-getopt');

let Getopt = new getopt([
    ['d', 'debug', 'debug output'],
    ['s', 'start', 'start with default log file'],
    ['h', 'help', 'display this help']
]);

Getopt.setHelp(
    "\nusage: api-json.js [OPTION]\n" +
    "[[OPTIONS]]\n"
);

Getopt.bindHelp();

let args = Getopt.parse(process.argv.slice(2));

if (args.options.debug) {
    debugMe = true;
}

let logfile = false;
if (args.options.start) {
    let lts = new Date();
    let logfileName = sprintf("dcs-%04d%02d%02d-%02d%02d%02d.LOG", lts.getFullYear(),
        lts.getMonth() + 1, lts.getDate(), lts.getUTCHours(), lts.getUTCMinutes(), lts.getUTCSeconds());

    console.log(logfileName);
    logfile = fs.openSync(logfileName, "w");
}

let redis = require('redis');
let client = redis.createClient();

client.on('error', function (err) {
    console.log("redis: " + err);
});

client.on('connect', function () {
    console.log('redis: connected');
});

function loggerLoop(err, serializedMessage) {
    // process messages from here
    serializedMessage.shift();

    if (err) {
        console.log("err: " + err);
    }
    else {
        let message = JSON.parse(serializedMessage);
        //console.dir(message);

        // check for commands
        if (message.deviceId === 'command') {
            // listen to any device with an ID of 'command'
            switch (message.messageType) {
                case 'startlog':

                    console.log("command: startlog " + message.data);
                    if (logfile) {
                        fs.closeSync(logfile);
                    }
                    logfile = fs.openSync(message.data, 'w');

                    break;
                case 'stoplog':
                    console.log("command: stoplog");

                    if (logfile) {
                        fs.closeSync(logfile);
                        logfile = false;
                    }
                    break;
            }
        }

        if (debugMe) {
            let rts = new Date(message.timestamp);

            console.log(rts.toISOString() + ' [' + message.device + '.' + message.deviceId + '] ' + message.messageType);
        }

        let line = message.timestamp + ',' +
            message.device + ',' + message.deviceId + ',' +
            message.messageType;

        // add data if message contains it
        if (message.data) {
            line += ',';
            line += message.data;
        }
        line = line + "\n";

        if (logfile) {
            // only write when log file is open
            fs.writeSync(logfile, line);
        }

        // send all the messages out to subscribers
        let feed = "DcsFeed." + message.device;
        client.publish(feed, serializedMessage);
    }

    // wait for next message
    client.blpop("DcsLogger", 0, loggerLoop);
}

// kick start the message handling loop
client.blpop("DcsLogger", 0, loggerLoop);


