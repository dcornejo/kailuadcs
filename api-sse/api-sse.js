#!/usr/bin/env node

/**
 * Created by dave on 12/17/16.
 */

'use strict';

// =================

const Hapi = require('hapi');
const Good = require('good');
const Susie = require('susie');
const printf = require('printf');

// ################################################################################

let redis = require("redis");
const pubClient = redis.createClient();

// tell the logger that the API is online!
// BUSMESSAGE: api-sse online
pubClient.rpush('DcsLogger', JSON.stringify({
    timestamp: new Date().valueOf(),
    device: 'api-sse',
    deviceId: 'status',
    messageType: 'online',
}));

// ################################################################################

const server = new Hapi.Server();
server.connection({port: 8080, routes: {cors: true}});

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply("Nothing useful here");
    }
});

// ################################################################################

// START COMMAND

server.route({
    method: 'GET',
    path: '/command/start',
    handler: function (request, reply) {

        let dcsTime = new Date().valueOf();
        let newFilename = "";

        if (request.query.filename) {
            newFilename = request.query.filename
        }
        else {
            // no filename specified, use default

            let ts = new Date();

            newFilename = 'dcs-' + ts.getUTCFullYear() +
                printf("%02d", ts.getUTCMonth() + 1) +
                printf("%02d", ts.getUTCDate()) + '-' +
                printf("%02d", ts.getUTCHours()) +
                printf("%02d", ts.getUTCMinutes()) +
                printf("%02d", ts.getUTCSeconds()) +
                ".log";
        }

        // BUSMESSAGE: startlog
        pubClient.rpush('DcsLogger', JSON.stringify({
            timestamp: new Date().valueOf(),
            device: 'api-sse',
            deviceId: 'command',
            messageType: 'startlog',
            data: newFilename
        }));

        let resp = {
            dcsTime: dcsTime,
            status: 'OK',
            command: 'START',
            data: newFilename
        };
        reply(resp);
    }
});

// ################################################################################

// STOP COMMAND

server.route({
    method: 'GET',
    path: '/command/stop',
    handler: function (request, reply) {

        let dcsTime = new Date().valueOf();

        // BUSMESSAGE: stoplog
        pubClient.rpush('DcsLogger', JSON.stringify({
            timestamp: new Date().valueOf(),
            device: 'api-sse',
            deviceId: 'command',
            messageType: 'stoplog'
        }));


        let resp = {
            dcsTime: dcsTime,
            status: 'OK',
            command: 'STOP'
        };
        reply(resp);
    }
});

// ################################################################################

// FILTER SET COMMAND

server.route({
    method: 'GET',
    path: '/command/setfilter',
    handler: function (request, reply) {

        let dcsTime = new Date().valueOf();
        let query = request.query;

        if (!query.setting) {
            let resp = {
                dcsTime: dcsTime,
                status: 'ERROR',
                message: 'missing parameter(s)'
            };

            reply(resp).code(400);
        }
        else {

            // BUSMESSAGE: filter
            pubClient.rpush('DcsLogger', JSON.stringify({
                timestamp: new Date().valueOf(),
                device: 'api-sse',
                deviceId: 'local',
                messageType: 'command',
                rxDevice: 'DSP',
                command: 'setfilter',
                setting: query.setting
            }));

            let resp = {
                dcsTime: dcsTime,
                status: 'OK',
                command: 'filter',
                setting: query.setting
            };
            reply(resp);
        }
    }
});

// ################################################################################

// GPS LOG COMMAND

server.route({
    method: 'GET',
    path: '/command/gps',
    handler: function (request, reply) {

        let dcsTime = new Date().valueOf();
        let query = request.query;

        if (!query.time || !query.lat || !query.lon) {
            let resp = {
                dcsTime: dcsTime,
                status: 'ERROR',
                message: 'missing parameter(s)'
            };

            reply(resp).code(400);
        }
        else {

            // BUSMESSAGE: gps
            pubClient.rpush('DcsLogger', JSON.stringify({
                timestamp: new Date().valueOf(),
                device: 'api-sse',
                deviceId: 'command',
                messageType: 'gps',
                data: [ query.time, query.lat, query.lon ]
            }));

            let resp = {
                dcsTime: dcsTime,
                status: 'OK',
                command: 'GPS',
                time: query.time,
                lat: query.lat,
                lon: query.lon
            };
            reply(resp);
        }
    }
});

// ################################################################################

// spew out the DCS data feed

server.route({
    method: 'GET',
    path: '/feed',
    handler: function (request, reply) {

        console.log("client connect");

        // temporary hack: keep the test code for SSE around
        if (1) {
            let redisClient = redis.createClient();

            redisClient.on('error', function (err) {
                console.log("redis error: " + err);
            });

            redisClient.on('connect', function () {
                redisClient.psubscribe('DcsFeed.*');
            });

            // received a message from the feed channel
            redisClient.on("pmessage", function (pattern, channel, message) {
                reply.event({data: JSON.parse(message)});
            });

            request.on("disconnect", function () {
                console.log("client disconnect");
                redisClient.quit();
            });
        }
        else {
            let timer = setInterval(function () {
                console.log("tick");
                let resp = {
                    dcsTime: new Date().valueOf(),
                    status: 'OK'
                };
                reply.event(resp);
            }, 1000);

            request.on("disconnect", function () {
                console.log("client disconnect");
                clearInterval(timer);
            });
        }
    }
});

// ################################################################################

server.register({
    register: Susie,
    options: {}

}, (err) => {
    if (err) {
        throw err;
    }
});

server.register({
    register: Good,
    options: {
        reporters: {
            console: [{
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [{
                    response: '*',
                    log: '*'
                }]
            }, {
                module: 'good-console'
            }, 'stdout']
        }
    }
}, (err) => {

    if (err) {
        throw err; // something bad happened loading the plugin
    }

    server.start((err) => {

        if (err) {
            throw err;
        }
        server.log('info', 'Server running at: ' + server.info.uri);
    });
});

