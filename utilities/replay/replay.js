#!/usr/bin/env node

"use strict";

let debugMe = false;

// =======================================

// figure out environment - what version and process options

let packageInfo = require('./package.json');
console.log(packageInfo.description + ' v' + packageInfo.version);

// =======================================

let getOpt = require('node-getopt');

let getopt = new getOpt([
    ['d', 'debug', 'debug mode'],
    ['h', 'help', 'display this help']
]);

getopt.setHelp(
    "Usage: node index.js [OPTION] <input file>\n\n" + "[[OPTIONS]]\n"
);

let cmdOptions = getopt.parseSystem(process.argv.slice(2));

if (cmdOptions.options.help) {
    getopt.showHelp();
    process.exit();
}

if (cmdOptions.options.debug) {
    debugMe = true;
}

const inputFile = cmdOptions.argv[0];

// =======================================

let redis = require('redis');
let client = redis.createClient();

client.on('error', function (err) {
    console.log('redis: ' + err);
});

function writeLog(device, deviceId, code, data) {
    let ts = new Date();

    let msg = {
        timestamp: ts.valueOf(),
        device: device,
        deviceId: deviceId,
        messageType: code
    };
    if (typeof(data) !== 'undefined') {
        msg.data = data;
    }

    client.rpush("DcsLogger", JSON.stringify(msg));
}

// =======================================

let index = -1;

const fs = require('fs');
const readline = require('readline');
const sleep = require('thread-sleep');

const reader = readline.createInterface({
    input: fs.createReadStream(inputFile)
});

let lineCount = 0;

reader.on('line', (buf) => {

    lineCount++;

    if ((lineCount % 100) == 0) {
        console.log(lineCount);
    }

    let data = buf.split(',');

    let ts = parseInt(data.shift(), 10);

    // delay message to approximate real time message flow
    if (index > 0) {
        let delay = ts - index;

        // delays <= 1 seem to cause problems, avoid
        // we are only approximating here anyway, don't use this for real timing
        if (delay > 3) {
            // console.log(">");
            sleep(delay);
            // console.log("<");
        }
    }
    index = ts;

    // having delayed an appropriate amount, send the message and carry on

    let device = data.shift();
    let deviceId = data.shift();
    let msgType = data.shift();

    let msg = {
        timestamp: ts,
        device: device,
        deviceId: deviceId,
        messageType: msgType
    };
    if (typeof(data) !== 'undefined') {
        msg.data = data;
    }

    client.rpush("DcsLogger", JSON.stringify(msg));

});

reader.on('close', () => {
    console.log('done');
    process.exit();
});

