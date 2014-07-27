var events = require('events');
var eventEmitter = new events.EventEmitter();

var config = require('./config');
var logger = require('./logger');
var jot = require('json-over-tcp');

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
var io = require('socket.io');
var browserServer = io.listen(config.browserPort, {
  logger: logger,
  origins: '*:*  127.0.0.1:* http:127.0.0.1:*'
});
browserServer.on('connection', function (socket) {
  logger.log('debug', 'connection');
  var f = function () {
    logger.log('debug', 'hello');
    socket.emit('hello', 'hello');
  };
  setInterval(f, 5000);

  eventEmitter.on('point', function (data) {
    logger.log('debug', 'point: ', data);
    socket.emit('point', data);
  })
});