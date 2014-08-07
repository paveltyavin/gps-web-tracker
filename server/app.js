var events = require('events');
var eventEmitter = new events.EventEmitter();

var config = require('./config');
var logger = require('./logger');
var _ = require('underscore');
var jot = require('json-over-tcp');
var io = require('socket.io');
var http = require('http');
var points = {};
var markers = {
  start: {
    id: 'start',
    lat: 55.74954,
    lng: 37.62158
  }
};

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
    if (!markerId) {
      return
    }
    var i, key;
    var keys = ['lat', 'lng', 'text', 'name', 'color'];
    var marker = markers[markerId];
    if (marker === undefined) {
      marker = {id: markerId};
      for (i = 0; i < keys.length; i++) {
        key = keys[i];
        marker[key] = data[key];
      }
      markers[markerId] = marker;
    } else {
      for (i = 0; i < keys.length; i++) {
        key = keys[i];
        if (data[key] !== undefined) {
          marker[key] = data[key];
        }
      }
    }

    logger.log('debug', 'add markerId, markers: ',markerId, markers);
    socket.broadcast.emit('add:marker', marker);
  });

  socket.on('update:marker', function (data) {
    var markerId = data.id;
    var i, key;
    var keys = ['lat', 'lng', 'text', 'name', 'color'];
    var marker = markers[markerId];
    for (i = 0; i < keys.length; i++) {
      key = keys[i];
      if (data[key] !== undefined) {
        marker[key] = data[key];
      }
    }
    logger.log('debug', 'update markerId, markers: ',markerId, markers);
    socket.broadcast.emit('update:marker', marker);
  });

  socket.on('remove:marker', function (markerId) {
    logger.log('debug', 'remove marker: ', markerId);
    delete markers[markerId];
    socket.broadcast.emit('remove:marker', markerId)
  });

  var addPoint = function (data) {
    logger.log('debug', 'point: ', data);
    socket.emit('add:point', data);
  };
  eventEmitter.on('point',addPoint);

  socket.on('disconnect', function(socket){
    eventEmitter.removeListener('point', addPoint);
  });

  socket.emit('add:points', _.values(points));
  socket.emit('add:markers', _.values(markers));
  setInterval(function () {
    var beforeNow = new Date(new Date - config.pointTTL);
    for (var pointId in points) {
      var point = points[pointId];
      if (point.modified < beforeNow) {
        delete points[pointId];
      }
    }
    socket.emit('add:points', _.values(points));
  }, config.pointCheckTime);
});