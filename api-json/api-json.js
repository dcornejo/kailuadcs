#!/usr/bin/env node

//
// DCS Tablet API
//

"use strict";

var packageInfo = require('./package.json');
console.log(packageInfo.description + ' v' + packageInfo.version);

// default if not specified
var lPort = 8124;
var debugMe = false;

var redis = require('redis');
var net = require('net');
var getopt = require('node-getopt');

var Getopt = new getopt([
    ['p', 'port=', 'listening port'],
    ['d', 'debug', 'debug output'],
    ['h', 'help', 'display this help']
]);

Getopt.setHelp(
    "\nusage: api-json.js [OPTION]\n" +
        "[[OPTIONS]]\n"
);

Getopt.bindHelp();

var args = Getopt.parse(process.argv.slice(2));

if (args.options.port) {
    lPort = args.options.port;
}

if (args.options.debug) {
    debugMe = true;
}

// create server

var server = net.createServer(function (sock) {

    // we have a new connection!

    // save these off for later (sock may be invalid in case of error or disconnect
    var remoteAddress = sock.remoteAddress;
    var remotePort = sock.remotePort;

    console.log('connection from ' + remoteAddress + ':' + remotePort);

    // create a redis client for this connection

    var client = redis.createClient();

    client.on('error', function (err) {
        // should unsubscribe and clean up here
        // terminate connection?
        console.log("[" + remotePort + "] redis error: " + err);
    });

    // client is connected
    client.on('connect', function () {
        if (debugMe) {
            console.log("["+ remotePort + "] redis connected");
        }

        // subscribe to all devices
        client.psubscribe('DcsFeed.*');
    });

    // client disconnected
    sock.on('end', function () {
        client.punsubscribe();
        client.quit();
        console.log('client disconnect from ' + remoteAddress + ':' + remotePort);
    });

    // received a message from the feed channel
    client.on("pmessage", function (pattern, channel, message) {

        if (debugMe) {
            console.log("[" + remotePort + "] <= " + message);
        }
        sock.write(message + "\n");
    });

    client.on("end", function () {
        if (debugMe) {
            console.log('[' + remotePort + '] redis disconnected');
        }
    });
});

server.on('error', function (err) {
    console.log('server: ' + err);
    process.exit();
});

server.listen(lPort, function () {
    console.log('API is listening for connections on port ' + lPort);
});
