#!/usr/bin/env node

//
// DCS Tablet API
//

"use strict";

let packageInfo = require('./package.json');
console.log(packageInfo.description + ' v' + packageInfo.version);

let redis = require('redis');
let getopt = require('node-getopt');

let Getopt = new getopt([
    ['h', 'help', 'display this help']
]);

Getopt.setHelp(
    "\nusage: voyeur.js [OPTION]\n" +
    "[[OPTIONS]]\n"
);

Getopt.bindHelp();

//var args = Getopt.parse(process.argv.slice(2));

let client = redis.createClient();

client.on('error', function (err) {
    // TODO: should unsubscribe and clean up here
    // terminate connection?
    console.log("redis error: " + err);
});

function check() {
    let dobj = new Date();
    let currentTime = dobj.valueOf();

    console.log('-- ' + currentTime);

    for (let key in deviceList) {
        let ts = deviceList[key].timestamp;
        console.log(key, ts, Math.floor((currentTime - ts) / 1000));
    }
}

// client is connected
client.on('connect', function () {
    console.log("redis connected");

    // subscribe to all devices
    client.psubscribe('DcsFeed.*');

    setInterval(check, 1000);
});

let deviceList = {};

// received a message from the feed channel
client.on("pmessage", function (pattern, channel, message) {

    let msg = JSON.parse(message);

    let timestamp = msg.timestamp;
    let device = msg.device;
    let deviceId = msg.deviceId;

    let key = device + "/" + deviceId;
    deviceList[key] = {'timestamp': timestamp};
});

client.on("end", function () {
    console.log('redis disconnected');
});

