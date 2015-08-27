var config = require('./config');
var logger = require('./logger');
var url = require('url');
var _ = require('underscore');
var express = require('express');
var jot = require('json-over-tcp');
var io = require('socket.io');
var http = require('http');
var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/gps-web-tracker', function (error) {
  if (error) {
    console.log(error);
  }
});

logger.log('debug', 'Start server application');

var Schema = mongoose.Schema;
var PointSchema = new Schema({
  id: String,
  lng: Number,
  lat: Number,
  modified: {type: Date, default: Date.now}
});
var Point = mongoose.model('points', PointSchema);

var MarkerSchema = new Schema({
  id: String,
  lng: Number,
  lat: Number,
  color: String,
  name: String
});
var Marker = mongoose.model('markers', MarkerSchema);

var LineSchema = new Schema({
  id: String,
  color: String,
  coordinates: Object,
  name: String
});
var Line = mongoose.model('line', LineSchema);

// Create server for devices
var deviceServer = jot.createServer(config.devicePort);
deviceServer.on('connection', function (socket) {
  socket.on('data', function (data) {
    logger.log('debug', 'device message: ', data);
    data.modified = new Date();
    if ((data.lat) && (data.lng) && (data.id)) {
      Point.findOne({id: data.id}, function (err, doc) {
        if (doc) {
          doc.lat = data.lat;
          doc.lng = data.lng;
          doc.modified = data.modified;
          doc.save();
        } else {
          var point = new Point(data);
          point.save();
        }
      });
      browserServer.emit('set:point', data);
    }
  });
});

deviceServer.listen(config.devicePort);

var app = http.createServer();
app.listen(config.browserPort);

// Create server for http messages from devices
var http_devices_app = express();
http_devices_app.get('/', function (request, response) {
  var data = {
    modified: new Date(),
    lat: request.query.latitude,
    lng: request.query.longitude,
    id: request.query.username
  };

  logger.log('debug', 'http_devices_app data = ', data);

  if ((data.lat) && (data.lng) && (data.id)) {
    Point.findOne({id: data.id}, function (err, doc) {
      if (doc) {
        doc.lat = data.lat;
        doc.lng = data.lng;
        doc.modified = data.modified;
        doc.save();
      } else {
        var point = new Point(data);
        point.save();
      }
    });
    browserServer.emit('set:point', data);
  }
  response.send('ok\n');
}).listen(9201);

var getModel = function (modelName) {
  var Model;
  if (modelName == 'marker') {
    Model = Marker;
  }
  if (modelName == 'line') {
    Model = Line;
  }
  if (modelName == 'point') {
    Model = Point;
  }
  return Model;
};

var getAddFunction = function (modelName, socket) {
  var Model = getModel(modelName);

  return function (data) {
    var objectId = data.id;
    if (!objectId) {
      return
    }
    Model.findOne({id: objectId}, function (err, object) {
      if (object) {
        object.update(data);
        object.save()
      } else {
        object = new Model(data);
        object.save();
      }

      socket.broadcast.emit('add:' + modelName, object);
    });

  }
};

var getUpdateFunction = function (modelName, socket) {
  var Model = getModel(modelName);
  return function (data) {
    var objectId = data.id;
    if (data._id) {
      delete data._id;
    }
    Model.update({id: objectId}, data, {}, function (err, docs) {
    });
    socket.broadcast.emit('update:' + modelName, data);
  }
};

var getDeleteFunction = function (modelName, socket) {
  var Model = getModel(modelName);
  return function (data) {
    var objectId = data.id;
    if (data._id) {
      delete data._id;
    }
    Model.remove({id: objectId}, function () {
    });
    socket.broadcast.emit('delete:' + modelName, objectId);
  }
};

var getHighlightFunction = function (modelName, socket) {
  return function (objectId) {
    socket.broadcast.emit('highlight:' + modelName, objectId);
  }
};

setInterval(function () {
  var old_date = new Date(new Date() - config.pointTTL);
  Point.remove({modified: {$not: {$gt: old_date}}}, function (err, docs) {
  });
}, config.pointCheckTime);


//Create server for browser
var browserServer = io(app, {
  logger: logger
});


browserServer.on('connection', function (socket) {
  socket.on('add:marker', getAddFunction('marker', socket));
  socket.on('add:line', getAddFunction('line', socket));

  socket.on('update:marker', getUpdateFunction('marker', socket));
  socket.on('update:line', getUpdateFunction('line', socket));

  socket.on('delete:marker', getDeleteFunction('marker', socket));
  socket.on('delete:line', getDeleteFunction('line', socket));

  socket.on('highlight:marker', getHighlightFunction('marker', socket));
  socket.on('highlight:line', getHighlightFunction('line', socket));

  Point.find({}, function (err, points) {
    socket.emit('set:points', points);
  });

  Marker.find({}, function (err, markers) {
    socket.emit('set:markers', markers);
  });

  Line.find({}, function (err, lines) {
    socket.emit('set:lines', lines);
  });
});

setInterval(function () {
  Point.find({}, function (err, points) {
    browserServer.emit('set:points', points);
  });
}, config.pointCheckTime);