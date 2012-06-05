var
  winston = require('winston');

module.exports.create = function() {

  var consoleTransport = new winston.transports.Console({ level: 'silly', timestamp: true, colorize: true })
    , logger = new winston.Logger({
        transports: [consoleTransport]
      });

  logger.exitOnError = false;

  return logger;
};