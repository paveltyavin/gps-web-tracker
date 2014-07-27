var events = require('events');
var eventEmitter = new events.EventEmitter();

var config = require('./config');
var logger = require('./logger');
var jot = require('json-over-tcp');
var io = require('socket.io');
var http = require('http');

// Create server for devices
var deviceServer = jot.createServer(config.devicePort);
deviceServer.on('connection', function (socket) {
  socket.on('data', function (data) {
    logger.log('debug', 'device message: ', data);
    if ((data.lat) && (data.lng) && (data.id)) {
      eventEmitter.emit('point', data);
    }
  });
});

deviceServer.listen(config.devicePort);

//Create server for browser
var app = http.createServer();
app.listen(config.browserPort);

var browserServer = io(app, {
    logger: logger
  });

browserServer.on('connection', function (socket) {
  socket.on('map', function(data){
    logger.log('debug', 'map: ', data);
  });

  eventEmitter.on('point', function (data) {
    logger.log('debug', 'point: ', data);
    socket.emit('point', data);
  })
});