#!/usr/bin/env node

//
// Bluetooth OBD-II reader
//

"use strict";

var obd2Device = false;

// =======================================

// figure out environment - what version and process options

var packageInfo = require('./package.json');
console.log(packageInfo.description + ' v' + packageInfo.version);

// =======================================

// Read in configuration file

var getOpt = require('node-getopt');
var getopt = new getOpt([
    ['i', 'init', 'create default log file on start'],
    ['a', 'address=', 'address/identifier of OBD-II reader'],
    ['h', 'help', 'display this help']
]);

getopt.setHelp(
    "Usage: node index.js [OPTION]\n\n" + "[[OPTIONS]]\n"
);

var cmdOptions = getopt.parseSystem(process.argv.slice(2));

if (cmdOptions.options.help) {
    getopt.showHelp();
    process.exit();
}

if (cmdOptions.options.address) {
    obd2Device = cmdOptions.options.address;
}
else {
    console.log('must specify an address');
    process.exit();
}

// =======================================

var redis = require('redis');
var client = redis.createClient();

client.on('error', function (err) {
    console.log('redis: ' + err);
});


function writeLog(device, deviceId, code, data) {
    var ts = new Date();

    var msg = {
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

// OBD-II READER

console.log('looking for OBD-II');

var OBDReader = require('bluetooth-obd');
var btOBDReader = new OBDReader();
var dataReceivedMarker = {};

btOBDReader.on('connected', function () {
    console.log('OBD connected');
    this.addPoller("vss");
    this.addPoller("rpm");
    this.addPoller("load_pct");

    this.startPolling(1000); //Request all values each second.
});

btOBDReader.on('dataReceived', function (data) {
    console.log(data);
    if (data.pid != null) {

        writeLog('OBD', '--', data.name, data.value);
    } else {
        writeLog('OBD', '--', 'no data', data.toString());
    }
    dataReceivedMarker = data;
});

btOBDReader.on('error', function (err) {
    console.log('error : ' + err);
    if (btOBDReader.isOpen !== true) {
        connectToOBD();
    }
});

btOBDReader.on('debug', function (info) {
    console.log('debug : ' + info);
});

//setInterval(checkObdConnection, 15000);
function checkObdConnection() {
    if (btOBDReader.isOpen === true) {
        console.log("btOBDReader.isOpen");
    } else {
        //console.log("connectToOBD");
        connectToOBD();
    }

}

function connectToOBD() {
    console.log("connectToOBD");
    try {
        //OBDReader.autoconnect(obd2Device);
        btOBDReader.autoconnect('obd');
    }
    catch (err) {
        console.log('obdConn: ' + err.context);
    }
}
setTimeout(connectToOBD, 1000);

writeLog('OBD', '--', 'STATUS', 'ONLINE');

console.log('running');
