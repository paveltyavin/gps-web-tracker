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

var lines = {
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

global.sockets = [];

eventEmitter.on('point', function (data) {
  logger.log('debug', 'point: ', data);
  _.each(sockets, function (socket) {
    socket.emit('add:point', data);
  });
});

var getObjects = function (modelName) {
  var objects;
  if (modelName == 'marker') {
    objects = markers;
  }
  if (modelName == 'line') {
    objects = lines;
  }
  return objects;
};

var getAddFunction = function (modelName, socket) {
  var objects = getObjects(modelName);

  return function (data) {
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

    logger.log('debug', 'add objectId: ', objectId);
    socket.broadcast.emit('add:' + modelName, objects[objectId]);
  }
};

var getUpdateFunction = function (modelName, socket) {
  var objects = getObjects(modelName);

  return function (data) {
    var objectId = data.id;
    objects[objectId] = data;
    logger.log('debug', 'update ' + modelName + 'Id: ', objectId);
    socket.broadcast.emit('update:' + modelName, objects[objectId]);
  }
};

var getDeleteFunction = function (modelName, socket) {
  var objects = getObjects(modelName);

  return function (data) {
    var objectId = data.id;
    delete objects[objectId];
    logger.log('debug', 'delete ' + modelName + 'Id: ', objectId);
    socket.broadcast.emit('delete:' + modelName, objectId);
  }
};

var getHighlightFunction = function (modelName, socket) {
  return function (objectId) {
    logger.log('debug', 'highlight ' + modelName + 'Id: ', objectId);
    socket.broadcast.emit('highlight:' + modelName, objectId);
  }
};

browserServer.on('connection', function (socket) {
  socket.on('add:marker', getAddFunction('marker', socket));
  socket.on('add:line', getAddFunction('line', socket));

  socket.on('update:marker', getUpdateFunction('marker', socket));
  socket.on('update:line', getUpdateFunction('line', socket));

  socket.on('delete:marker', getDeleteFunction('marker', socket));
  socket.on('delete:line', getDeleteFunction('line', socket));

  socket.on('highlight:marker', getHighlightFunction('marker', socket));
  socket.on('highlight:line', getHighlightFunction('line', socket));

  global.sockets.push(socket);

  socket.on('disconnect', function () {
    global.sockets.pop(socket);
  });

  socket.emit('set:points', _.values(points));
  socket.emit('set:markers', _.values(markers));
  socket.emit('set:lines', _.values(lines));
});