#!/usr/bin/env node

/**
 * Created by dave on 8/26/16.
 */

//
// DCS Operations
//

"use strict";

let configFilename = "";
let debugMe = false;

// =======================================

// figure out environment - what version and process options

let packageInfo = require('./package.json');
console.log(packageInfo.description + ' v' + packageInfo.version + "\n");

// =======================================

let getOpt = require('node-getopt');
let getopt = new getOpt([
    ['c', 'config=', 'specify configuration file'],
    ['d', 'debug', 'debug mode'],
    ['h', 'help', 'display this help']
]);

getopt.setHelp(
    "Usage: node ops.js [OPTION]\n\n" + "[[OPTIONS]]\n"
);

let cmdOptions = getopt.parseSystem(process.argv.slice(2));

if (cmdOptions.options.help) {
    getopt.showHelp();
    process.exit();
}

if (cmdOptions.options.debug) {
    debugMe = true;
}

if (cmdOptions.options.config) {
    configFilename = cmdOptions.options.config;
}
else {
    console.log('must specify configuration file');
    getopt.showHelp();
    process.exit();
}

// =======================================

// we can send messages to the logger before we start it
// we assume that redis is started at boot time, so the messages
// will queue up there.

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

function getTime () {
    let ts = new Date();
    return (ts.toISOString());
}

// =======================================

let jsonfile = require('jsonfile');

let config = jsonfile.readFileSync(configFilename);

let confLogger = config.logger;
let confSources = config.sources;
let confApis = config.apis;

// logger is REQUIRED
const spawn = require('child_process').spawn;
const childLogger = spawn(confLogger.path, confLogger.options);
console.log(getTime() + ': logger [' + childLogger.pid + '] spawned');
writeLog('OPS', 'localhost', 'start', "logger[" + childLogger.pid + "]");

// ========== start up data sources ==========

let dsProcessInfo = {};

function respawnDs(code, signal) {

    // 'this' is the ChildProcess object that exited
    // interesting: 'this' is empty unless it's called from within the event handler
    // can we use this to make a generic spawn function? hmmm...

    let deadPid = this.pid;
    let whatDied = dsProcessInfo[deadPid];

    console.log(getTime() + ": " + whatDied.description + "[" + deadPid + "] exited");
    writeLog('OPS', 'localhost', 'exit', whatDied.description + "[" + deadPid + "]");

    let child = spawn(whatDied.path, whatDied.options);
    dsProcessInfo[child.pid] = whatDied;
    console.log(getTime() + ": " + whatDied.description + " [" + child.pid + "] respawned");
    writeLog('OPS', 'localhost', 'restart', whatDied.description + "[" + child.pid + "]");

    // handle process exit
    child.on('exit', respawnDs);
}

for (let i = 0; i < confSources.length; i++) {
    let source = confSources[i];

    let dsChild = spawn(source.path, source.options);
    dsProcessInfo[dsChild.pid] = source;
    console.log(getTime() + ": " + source.description + " [" + dsChild.pid + "] spawned");
    writeLog('OPS', 'localhost', 'start', source.description + "[" + dsChild.pid + "]");

    // handle process exit
    dsChild.on('exit', respawnDs);
}

// ========== start up APIs ==========

let apiProcessInfo = {};

function respawnApi(code, signal) {

    // 'this' is the ChildProcess object that exited
    // interesting: 'this' is empty unless it's called from within the event handler
    // can we use this to make a generic spawn function? hmmm...

    let deadPid = this.pid;
    let whatDied = apiProcessInfo[deadPid];

    console.log(getTime() + ": " + whatDied.description + "[" + deadPid + "] exited");
    writeLog('OPS', 'localhost', 'exit', whatDied.description + "[" + deadPid + "]");

    let child = spawn(whatDied.path, whatDied.options);
    dsProcessInfo[child.pid] = whatDied;
    console.log(getTime() + ": " + whatDied.description + " [" + child.pid + "] respawned");
    writeLog('OPS', 'localhost', 'restart', whatDied.description + "[" + child.pid + "]");

    // handle process exit
    child.on('exit', respawnApi);
}


for (let i = 0; i < confApis.length; i++) {
    let api = confApis[i];

    let child = spawn(api.path, api.options);
    apiProcessInfo[child.pid] = api;
    console.log(getTime() + ": " + api.description + " [" + child.pid + "] spawned");
    writeLog('OPS', 'localhost', 'start', api.description + "[" + childLogger.pid + "]");

    child.on('exit', respawnApi);
}

