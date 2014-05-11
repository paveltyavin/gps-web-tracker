var jot = require('json-over-tcp');
var config = require('./config');
var socket = jot.connect(config.devicePort, function () {
  socket.write({lat: '0', lng: 0, id: 0});
});