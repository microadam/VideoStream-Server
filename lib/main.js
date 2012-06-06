var url = require('url');

module.exports.init = function(app, serviceLocator) {

  function stripPath(reqUrl, path) {
    return url.parse(reqUrl).pathname.replace(path, '').replace(/%20/g, ' ');
  }

  app.post('/video/announce', function(req, res) {
    serviceLocator.deviceManager.authenticate(req.rawBody, function(response) {
      res.contentType('text/xml');
      res.send(response);
    });
  });

  app.get('/video/files', function(req, res) {
    serviceLocator.mediaManager.getRootFolders(function(response) {
      res.contentType('text/xml');
      res.send(response);
    });
  });

  app.get('/video/files/*', function(req, res) {
    var path = stripPath(req.url, '/video/files/');
    serviceLocator.mediaManager.listFilesInPath(path, function(response) {
      res.contentType('text/xml');
      res.send(response);
    });
  });


  app.post('/video/convert/*', function(req, res) {
    var path = stripPath(req.url, '/video/convert/');
    serviceLocator.logger.info('Conversion request received for: ' + path);
    serviceLocator.mediaManager.convertFile(path, req.rawBody, function(response) {
      res.contentType('text/xml');
      res.send(response);
    });
  });

  app.get('/video/convertcancel/*', function(req, res) {
    var path = stripPath(req.url, '/video/convertcancel/');
    serviceLocator.conversionManager.cancelConversion(path, function(response) {
      res.contentType('text/xml');
      res.send(response);
    });
  });

  app.get('/video/cache/offline/*', function(req, res) {
    var fileName = stripPath(req.url, '/video/cache/offline/');
    serviceLocator.conversionManager.getCompletedConversion(fileName, function(convertedFilePath) {
      res.download(convertedFilePath, function(error) {
        if(error) {
          throw new Error(error);
        }
      });
    });
  });

  app.get('/video/convertdelete/*', function(req, res) {
    var fileName = stripPath(req.url, '/video/convertdelete//video/cache/offline/');
    serviceLocator.conversionManager.deleteConverted(fileName, function(response) {
      res.contentType('text/xml');
      res.send(response);
    });
  });

  app.get('/video/convertstatus', function(req, res) {
    serviceLocator.conversionManager.getConvertedVideos(req.headers.host, function(response) {
      res.contentType('text/xml');
      res.send(response);
    });
  });


  // app.post('*', function(req, res, next) {
  //   console.log('POST ' + req.url);
  //   console.log(req.rawBody);
  //   next();
  // });

  // app.get('*', function(req, res, next) {
  //   console.log('GET ' + req.url);
  //   next();
  // });

};