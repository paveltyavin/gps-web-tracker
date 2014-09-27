var config = require('./config');
var logger = require('./logger');
var _ = require('underscore');
var jot = require('json-over-tcp');
var io = require('socket.io');
var http = require('http');
var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/gps-web-tracker', function (error) {
  if (error) {
    console.log(error);
  }
});


var Schema = mongoose.Schema;
var PointSchema = new Schema({
  id: String,
  lng: Number,
  lat: Number,
  modified: { type: Date, default: Date.now }
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
  logger.log('debug', 'deviceServer connection');
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
          logger.log('debug', 'old Point', data);
        } else {
          var point = new Point(data);
          point.save();
          logger.log('debug', 'new Point', data);
        }
      });
      browserServer.emit('set:point', data);
    }
  });
});

deviceServer.listen(config.devicePort);

var app = http.createServer();
app.listen(config.browserPort);

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

      logger.log('debug', 'add objectId: ', objectId);
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
      logger.log('debug', docs);
    });
    logger.log('debug', 'update ' + modelName + 'Id: ', objectId, 'data: ', data);
    logger.log('debug', 'update ' + modelName + 'Id: ', objectId);
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

setInterval(function () {
  var old_date = new Date(new Date() - config.pointTTL);
  Point.remove({modified: {$not: {$gt: old_date}}}, function (err, docs) {
    logger.log('debug', 'remove points');
  });
}, config.pointCheckTime);


//Create server for browser
var browserServer = io(app, {
  logger: logger
});


browserServer.on('connection', function (socket) {
  logger.log('debug', 'browserServer connection');
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

  Point.find({}, function (err, points) {
    console.log(points)
  });

  Marker.find({}, function (err, markers) {
    socket.emit('set:markers', markers);
  });

  Line.find({}, function (err, lines) {
    socket.emit('set:lines', lines);
  });
});