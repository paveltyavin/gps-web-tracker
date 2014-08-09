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

var polygons = {
  start: {
    id: 'start',
    coordinates:[[
      [55.74954, 37.52158],
      [55.64954, 37.52158],
      [55.74954, 37.42158],
      [55.64954, 37.42158]
    ],[]]
  }
};
var lines = {
  start: {
    id: 'start',
    coordinates:[
      [55.54954, 37.82158],
      [55.44954, 37.42158],
      [55.64954, 37.22158],
      [55.44954, 37.12158]
    ]
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

var addFunction = function(model, socket){
  var objects;
  if (model=='marker'){
    objects = markers;
  }
  if (model=='polygon'){
    objects = polygons;
  }
  return function(data){
    var objectId = data.id;
    if (!objectId) {
      return
    }
    var object = objects[objectId];
    if (object === undefined) {
      objects[objectId] = data;
    } else {
      objects[objectId] = _.extend(object, data);
    }

    logger.log('debug', 'add objectId: ',objectId);
    socket.broadcast.emit('add:'+model, objects[objectId]);
  }
};

var updateFunction = function(model, socket){
  var objects;
  if (model=='marker'){
    objects = markers;
  }
  if (model=='polygon'){
    objects = polygons;
  }
  return function (data) {
    var objectId = data.id;
    objects[objectId] = data;
    logger.log('debug', 'update ' + model + 'Id: ',objectId);
    socket.broadcast.emit('update:'+model, objects[objectId]);
  }
}

browserServer.on('connection', function (socket) {
  socket.on('add:marker', addFunction('marker', socket));
  socket.on('add:polygon', addFunction('polygon', socket));

  socket.on('update:marker', updateFunction('marker', socket));
  socket.on('update:polygon', updateFunction('polygon', socket));

  socket.on('delete:marker', function (data) {
    var objectId = data.id;
    delete markers[objectId];
    logger.log('debug', 'delete marker: ', objectId);
    socket.broadcast.emit('delete:marker', objectId)
  });


  socket.on('delete:polygon', function (data) {
    var objectId = data.id;
    delete polygons[objectId];
    logger.log('debug', 'delete polygon: ', objectId);
    socket.broadcast.emit('delete:polygon', objectId)
  });

  var addPoint = function (data) {
    logger.log('debug', 'point: ', data);
    socket.emit('add:point', data);
  };
  eventEmitter.on('point',addPoint);

  socket.on('disconnect', function(socket){
    eventEmitter.removeListener('point', addPoint);
  });

  socket.emit('set:points', _.values(points));
  socket.emit('set:markers', _.values(markers));
  socket.emit('set:polygons', _.values(polygons));
  socket.emit('set:lines', _.values(lines));
  setInterval(function () {
    var beforeNow = new Date(new Date - config.pointTTL);
    for (var pointId in points) {
      var point = points[pointId];
      if (point.modified < beforeNow) {
        delete points[pointId];
      }
    }
    socket.emit('set:points', _.values(points));
  }, config.pointCheckTime);
});