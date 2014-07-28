var events = require('events');
var eventEmitter = new events.EventEmitter();

var config = require('./config');
var logger = require('./logger');
var jot = require('json-over-tcp');
var io = require('socket.io');
var http = require('http');
var points = {};
var markers = {};

// Create server for devices
var deviceServer = jot.createServer(config.devicePort);
deviceServer.on('connection', function (socket) {
  socket.on('data', function (data) {
    logger.log('debug', 'device message: ', data);
    data.modified = new Date;
    if ((data.lat) && (data.lng) && (data.id)) {
      points[data.id] = data;
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
  socket.on('add:marker', function (data) {
    var markerId = data.id;
    markers[markerId] = {
      id:markerId,
      lat:data.lat,
      lng:data.lng,
      name:data.name,
      text:data.text
    };
    logger.log('debug', 'add marker markers: ', markers);
    socket.broadcast.emit('add:marker', markers[markerId]);
  });

  socket.on('remove:marker', function (markerId) {
    logger.log('debug', 'remove marker: ', markerId);
    delete markers[markerId];
    socket.broadcast.emit('remove:marker', markerId)
  });

  eventEmitter.on('point', function (data) {
    logger.log('debug', 'point: ', data);
    socket.emit('add:point', data);
  });

  socket.emit('add:points', points);
  socket.emit('add:markers', markers);
  setInterval(function () {
    var beforeNow = new Date(new Date - config.pointTTL);
    for (var pointId in points) {
      var point = points[pointId];
      if (point.modified < beforeNow) {
        delete points[pointId];
      }
    }
    socket.emit('add:points', points);
    socket.emit('add:markers', markers);
  }, config.pointCheckTime);
});