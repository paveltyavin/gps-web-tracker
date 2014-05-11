var events = require('events');
var eventEmitter = new events.EventEmitter();

var config = require('./config');
var logger = require('./logger');
var jot = require('json-over-tcp');

// Create server for devices
var deviceServer = jot.createServer(config.devicePort);
deviceServer.on('connection',function (socket) {
  socket.on('data', function (data) {
    logger.log('debug', 'device message: ', data);
    if ((data.lat) && (data.lng) && (data.id)) {
      eventEmitter.emit('point', data);
    }
  });
});

deviceServer.listen(config.devicePort);

//Create server for browser
var io = require('socket.io').listen(config.browserPort, {
  logger: logger
});
io.sockets.on('connection', function (socket) {
  eventEmitter.on('point', function (data) {
    logger.log('debug', 'point: ', data);
    socket.emit('point', data);
  })
});