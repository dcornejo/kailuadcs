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

let args = Getopt.parse(process.argv.slice(2));

let client = redis.createClient();

client.on('error', function (err) {
    // TODO: should unsubscribe and clean up here
    // terminate connection?
    console.log("redis error: " + err);
});

// client is connected
client.on('connect', function () {
    console.log("redis connected");

    // subscribe to all devices
    client.psubscribe('DcsFeed.*');
});

// received a message from the feed channel
client.on("pmessage", function (pattern, channel, message) {

    let msg = JSON.parse(message);

    let timestamp = new Date(msg.timestamp);

    console.log(timestamp.toString() + ' [' + msg.device + '.' + msg.deviceId + '] ' + msg.messageType);
});

client.on("end", function () {
    console.log('redis disconnected');
});

