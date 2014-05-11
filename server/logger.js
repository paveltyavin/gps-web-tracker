var winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({level:'debug', json: false, timestamp: true }),
    new winston.transports.File({ filename: __dirname + '/debug.log', json: true })
  ],
  exceptionHandlers: [
    new (winston.transports.Console)({ json: false, timestamp: true }),
    new winston.transports.File({ filename: __dirname + '/error.log', json: true })
  ],
  exitOnError: false
});

module.exports = logger;