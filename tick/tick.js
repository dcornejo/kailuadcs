#!/usr/bin/env node

//
// A very simple data source that adds a timestamp to the logger queue
//

// default interval (in milliseconds)
var interval = 60000;
var debugMe = false;

var getopt = require('node-getopt');

var Getopt = new getopt([
    ['i', 'interval=', 'tick interval in seconds'],
    ['d', 'debug', 'debug output'],
    ['h', 'help', 'display this help']
]);

Getopt.setHelp(
    "\nusage: tick.js [OPTION]\n" +
    "[[OPTIONS]]\n"
);

Getopt.bindHelp();

var args = Getopt.parse(process.argv.slice(2));

if (args.options.interval) {
    interval = args.options.interval * 1000;
}
console.log('interval ' + interval);

if (args.options.debug) {
    debugMe = true;
}

var redis = require("redis");
var client = redis.createClient();
var ts = 0;

function tick() {
    ts = new Date();

    var msg = {
        timestamp: ts.valueOf(),
        device: 'tick',
        deviceId: 'localhost',
        messageType: 'tick',
        data: ts.toISOString()
    };

    var msgString = JSON.stringify(msg);

    if (debugMe) {
        console.log(msg.data);
    }
    client.rpush("DcsLogger", msgString);

    setTimeout(tick, interval);
}

setTimeout(tick, 10);
