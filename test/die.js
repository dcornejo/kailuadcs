#!/usr/bin/env node

//
// test - wait a while and die to exercise ops manager
//

"use strict";

// default interval (in milliseconds)
let interval = 60000;
let debugMe = false;

let getopt = require('node-getopt');

let Getopt = new getopt([
    ['i', 'interval=', 'tick interval in seconds'],
    ['d', 'debug', 'debug output'],
    ['h', 'help', 'display this help']
]);

Getopt.setHelp(
    "\nusage: tick.js [OPTION]\n" +
    "[[OPTIONS]]\n"
);

Getopt.bindHelp();

let args = Getopt.parse(process.argv.slice(2));

if (args.options.interval) {
    interval = args.options.interval * 1000;
}

if (args.options.debug) {
    debugMe = true;
}

if (debugMe) {
    console.log('death in ' + interval + "ms");
}

function monkeyDieDead () {
    if (debugMe) {
        console.log("arrgghh");
    }
    process.exit(1);
}

setTimeout(monkeyDieDead, interval);


