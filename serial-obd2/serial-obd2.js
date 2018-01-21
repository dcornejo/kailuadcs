#!/usr/bin/env node

//
// Serial OBD-II Reader
//

"use strict";

let serialObd2Device = false;
let debugMe = false;

// =======================================

// figure out environment - what version and process options

let packageInfo = require('./package.json');
console.log(packageInfo.description + ' v' + packageInfo.version);

// =======================================

let getOpt = require('node-getopt');
const fs = require('fs');

let getopt = new getOpt([
    ['i', 'interface=', 'specify device interface'],
    ['d', 'debug', 'debug mode'],
    ['h', 'help', 'display this help']
]);

getopt.setHelp(
    "Usage: node index.js [OPTION]\n\n" + "[[OPTIONS]]\n"
);

let cmdOptions = getopt.parseSystem(process.argv.slice(2));

if (cmdOptions.options.help) {
    getopt.showHelp();
    process.exit();
}

if (cmdOptions.options.debug) {
    debugMe = true;
}

if (cmdOptions.options.interface) {
    serialObd2Device = fs.realpathSync(cmdOptions.options.interface);
}
else {
    console.log('must specify an interface');
    process.exit();
}

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

// Serial/USB OBD-II READER

let OBDReader = require('serial-obd');

let serialOBDReader = new OBDReader(serialObd2Device, {
    baudrate: 115200
});

let dataReceivedMarker = {};

serialOBDReader.on('connected', function () {
    this.addPoller("vss");
    this.addPoller("rpm");
    this.addPoller("load_pct");

    this.startPolling(1000); //Request all values each second.
});

serialOBDReader.on('dataReceived', function (data) {

    if (debugMe) {
        console.log(data);
    }
    if (data.pid != null) {
        writeLog('OBD', '--', data.name, data.value);
    }
    else if (data.value) {
        writeLog('OBDII', '--', 'STATUS', data.value);
    }
    else {
        writeLog('OBDII', '--', 'no data', data);
    }

    dataReceivedMarker = data;
});

// Use first device with 'obd' in the name
try {
    serialOBDReader.connect(serialObd2Device);
}
catch (err) {
    console.log('OBD-II connect: ' + err.context);
}

console.log('running');
