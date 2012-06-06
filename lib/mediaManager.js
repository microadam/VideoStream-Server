var fs = require('fs')
  , async = require('async')
  , Tempus = require('Tempus')
  , mime = require('mime')
  , _ = require('underscore')
  , xml2js = require('xml2js')
  , parser = new xml2js.Parser();

module.exports.create = function(serviceLocator) {
  var self = {};

  function convertLocalPath(localPath) {
    var pathParts = localPath.split('/')
      , rootFolder = pathParts[0];

    delete pathParts[0];
    pathParts = _.compact(pathParts);
    var subPaths = pathParts.join('/')
      , actualPath = serviceLocator.properties.mediaFolders[rootFolder] + '/' + subPaths;

    return actualPath;
  }

  function fileIsAllowed(fileName, directory) {
    // do not show hidden folders
    if (fileName.indexOf('.') === 0) {
      return false;
    }
    // only show files with a video type
    mime.define({
      'video/x-matroska': ['mkv']
    });
    if (!directory && mime.lookup(fileName).indexOf('video') === -1) {
      return false;
    }
    return true;
  }

  self.cleanFileNames = function(fileName) {
    return fileName.replace(/&/g, '&amp;');
  };

  self.getRootFolders = function(callback) {
    var rootFolders = []
      , properties = serviceLocator.properties;

    Object.keys(properties.mediaFolders).forEach(function(folderName) {
      var folder = [{
        name: 'folder',
        children: [{
          filename: folderName,
          date: ''
        }]
      }];
      rootFolders.push(folder);
    });

    var response = [{
      name: 'videostream',
      children: [{
        name: 'files',
        children: rootFolders
      }]
    }];
    serviceLocator.xmlHandler.generate(response, callback);
  };

  self.getFileStats = function(path, callback) {
    var fileNames = fs.readdirSync(path)
      , files = {};

    async.forEach(
      fileNames,
      function(file, eachCallback) {
        fs.stat(path + '/' + file, function(error, stats) {
          if(error) {
            throw new Error(error);
          }
          var isDirectory = stats.isDirectory();
          if (fileIsAllowed(file, isDirectory)) {
            files[file] = {size: stats.size, date: stats.mtime, directory: isDirectory};
          }
          eachCallback();
        });
      },
      function() {
        callback(files);
      }
    );
  };

  self.listFilesInPath = function(path, callback) {
    var actualPath = convertLocalPath(path);
    self.getFileStats(actualPath, function(files) {
      var sortedFiles = Object.keys(files).sort()
        , processedFiles = [];

      sortedFiles.forEach(function(file) {
        var node = 'video';
        if (files[file].directory) {
          node = 'folder';
        }
        processedFiles.push([{
          name: node,
          children: [{
            filename: self.cleanFileNames(file),
            date: new Tempus(files[file].date).toString('%F %T')
          }]
        }]);
      });
      var response = [{
        name: 'videostream',
        children: [{
          name: 'files',
          children: processedFiles
        }]
      }];
      serviceLocator.xmlHandler.generate(response, callback);
    });
  };

  self.convertFile = function(path, settingsXml, callback) {
    settingsXml = '<VideoStream><ClientIdentifier>20e6932cba948f45eebf42e0a95c4108</ClientIdentifier><Resolution width="768" height="576" aspect="nan"/><Bitrate target="3550" tolerance="3905"/></VideoStream>';
    var actualPath = convertLocalPath(path);
    parser.parseString(settingsXml, function (err, settings) {
      var width = settings.Resolution['@'].width
        , height = settings.Resolution['@'].height;

      settings = {width: width, height: height, aspect: width / height, bitrate: settings.Bitrate['@'].target};
      serviceLocator.conversionManager.convertVideo(path, actualPath, settings, function(response) {
        callback(response);
      });
    });
  };

  return self;
};