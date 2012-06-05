var url = require('url');

module.exports.init = function(app, serviceLocator) {


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
    var path = url.parse(req.url).pathname.replace('/video/files/', '');
    serviceLocator.mediaManager.listFilesInPath(path, function(response) {
      res.contentType('text/xml');
      res.send(response);
    });
  });


  app.post('/video/convert/*', function(req, res) {
    var path = url.parse(req.url).pathname.replace('/video/convert/', '');
    serviceLocator.mediaManager.convertFile(path, req.rawBody, function(response) {
      res.contentType('text/xml');
      res.send(response);
    });
  });

  app.get('/video/convertcancel/*', function(req, res) {
    var path = url.parse(req.url).pathname.replace('/video/convertcancel/', '');
    serviceLocator.conversionManager.cancelConversion(path, function(response) {
      res.contentType('text/xml');
      res.send(response);
    });
  });

  app.get('/video/cache/offline/*', function(req, res) {
    var fileName = url.parse(req.url).pathname.replace('/video/cache/offline/', '');
    serviceLocator.conversionManager.getCompletedConversion(fileName, function(convertedFilePath) {
      res.download(convertedFilePath, function(error) {
        if(error) {
          throw new Error();
        }
      });
    });
  });

  app.get('/video/convertdelete/*', function(req, res) {
    var fileName = url.parse(req.url).pathname.replace('/video/convertdelete//video/cache/offline/', '');
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

  app.get('*', function(req, res, next) {
    console.log('GET ' + req.url);
    next();
  });

};