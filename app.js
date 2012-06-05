var express = require('express')
  , app = express.createServer();

app.use(function(req, res, next) {
  var data='';
  req.setEncoding('utf8');
  req.on('data', function(chunk) { 
     data += chunk;
  });

  req.on('end', function() {
    req.rawBody = data;
    next();
  });
});

var properties = require('./properties').getProperties()
  , serviceLocator = require('service-locator').createServiceLocator()
  , logger = require('./lib/logger').create()
  , xmlHandler = require('./lib/xmlHandler').create(serviceLocator)
  , deviceManager = require('./lib/deviceManager').create(serviceLocator)
  , mediaManager = require('./lib/mediaManager').create(serviceLocator)
  , conversionManager = require('./lib/conversionManager').create(serviceLocator)
  , main = require('./lib/main');

serviceLocator
    .register('logger', logger)
    .register('properties', properties)
    .register('xmlHandler', xmlHandler)
    .register('deviceManager', deviceManager)
    .register('conversionManager', conversionManager)
    .register('mediaManager', mediaManager);

main.init(app, serviceLocator);

app.listen(8683);

serviceLocator.logger.info('Server Started');