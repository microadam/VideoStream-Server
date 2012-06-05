var spawn = require('child_process').spawn
  , fs = require('fs')
  , Tempus = require('Tempus');

module.exports.create = function(serviceLocator) {
  var self = {}
    , conversionsInProgress = {};

  function setDuration(data, conversion) {
    data = data.toString();
    if (new RegExp(/Duration: (.*?),/).test(data)) {     
      var durationMatches = data.match(/Duration: (.*?),/)
        , durationString = durationMatches[1]
        , durationParts = durationString.split(':')
        , hoursInSeconds = +durationParts[0] * 60 * 60
        , minutesInSeconds = +durationParts[1] * 60
        , seconds = +durationParts[2]
        , duration = hoursInSeconds + minutesInSeconds + seconds;

      conversion.duration = duration;
    }
  }

  function setPercentage(data, conversion) {
    data = data.toString();
    if (new RegExp(/time=(.*?) /).test(data)) {
      var timeParts = data.match(/time=(.*?) /)
        , time =  +timeParts[1]
        , percentage = (time * 100) / conversion.duration;

      conversion.percentComplete = percentage;
    }
  }

  self.convertVideo = function(path, actualPath, settings, callback) {
    path = '/' + path;
    var inProgressPath = serviceLocator.properties.conversionInProgressPath
      , completePath = serviceLocator.properties.conversionCompletePath
      , pathParts = actualPath.split('/')
      , fileName = pathParts[pathParts.length - 1]
      , options = [
          '-i', actualPath,
          '-me_range', '-16',
          '-qdiff', '4',
          '-qmin', '10',
          '-qmax', '51',
          '-qcomp', '0.6',
          '-trellis', '0',
          '-sc_threshold', '40',
          '-subq', '5',
          '-partitions', '+parti4x4+parti8x8+partp8x8',
          '-cmp', '+chroma',
          '-deblockalpha', '0',
          '-deblockbeta', '0',
          '-keyint_min', '25',
          '-b_strategy', '0',
          '-bf', '0',
          '-flags', '+loop',
          '-flags2', '+fast',
          '-level', '13',
          '-maxrate', settings.bitrate + 'k',
          '-bufsize', '512k',
          '-wpredp', '0',
          '-b', settings.bitrate + 'k',
          '-bt', settings.bitrate + 'k',
          '-async', '2',
          '-vcodec', 'libx264',
          '-ac', '2',
          '-map', '0:0',
          '-map', '0:1',
          '-r', '29.97',
          '-acodec', 'libmp3lame',
          '-ar', '44100',
          '-ab', '196k',
          '-f', 'mov',
          '-s', settings.width + 'x' + settings.width / (16/9),
          '-aspect', (16 / 9),
          '-threads', '1',
          inProgressPath + '/' + fileName
        ];
    
    fs.stat(inProgressPath + '/' + fileName, function(error) {
      if (!error) {
        // delete file if it exists - Might want to rename instead of deleting?
       fs.unlinkSync(inProgressPath + '/' + fileName);
      }

      var ffmpeg = spawn('ffmpeg', options);
      conversionsInProgress[path] = {startTime: new Date(), percentComplete: 0, duration: 0, pid: ffmpeg.pid};

      ffmpeg.stderr.on('data', function(data) {
        setDuration(data, conversionsInProgress[path]);
        setPercentage(data, conversionsInProgress[path]);
      });
      ffmpeg.on('exit', function(code) {
        if (code === 0) {
          fs.renameSync(inProgressPath + '/' + fileName, completePath + '/' + fileName);
        }
        delete conversionsInProgress[path];
      });

      var response = [{
        name: 'VideoStream',
        children: [{
          SucceessMsg: 'Success'
        }]
      }];
      serviceLocator.xmlHandler.generate(response, callback);
    });
  };

  self.getConvertedVideos = function(requestUrl, callback) {
    serviceLocator.mediaManager.getFileStats(serviceLocator.properties.conversionCompletePath, function(files) {
      var sortedFiles = Object.keys(files).sort()
        , processedFiles = [];

      sortedFiles.forEach(function(file) {
        processedFiles.push([{
          name: 'convertVideo',
          children: [{
            filename: serviceLocator.mediaManager.cleanFileNames(file),
            date: new Tempus(files[file].date).toString('%F %T'),
            clientIdentifier: '*',
            status: 'Finished',
            URL: 'http://' + requestUrl + '/' + 'video/cache/offline/' + serviceLocator.mediaManager.cleanFileNames(file),
            TotalBytes: files[file].size
          }]
        }]);
      });

      var sortedInProgress = Object.keys(conversionsInProgress).sort();
      sortedInProgress.forEach(function(file) {
        var currentDate = new Date()
          , startTime = conversionsInProgress[file].startTime.getTime()
          , now = currentDate.getTime();

        processedFiles.push([{
          name: 'convertVideo',
          children: [{
            filename: serviceLocator.mediaManager.cleanFileNames(file),
            date: '',
            clientIdentifier: '*',
            status: 'Active',
            elapsedSeconds: (now - startTime) / 1000,
            percentComplete: conversionsInProgress[file].percentComplete
          }]
        }]);
      });

      var response = [{
        name: 'VideoStream',
        children: [{
          name: 'files',
          children: processedFiles
        }]
      }];
      serviceLocator.xmlHandler.generate(response, callback);
    });
  };

  self.getCompletedConversion = function(fileName, callback) {
    callback(serviceLocator.properties.conversionCompletePath + '/' + fileName);
  };

  self.cancelConversion = function(path, callback) {
    path = '/' + path.replace('%2520', '%20');
    var processId = conversionsInProgress[path].pid;
    process.kill(processId, 'SIGKILL');
    var response = [{
        name: 'VideoStream',
        children: [{
          SucceessMsg: 'Success'
        }]
      }];
    serviceLocator.xmlHandler.generate(response, callback);
  };

  self.deleteConverted = function(fileName, callback) {
    fs.unlinkSync(serviceLocator.properties.conversionCompletePath + '/' + fileName);
    var response = [{
        name: 'VideoStream',
        children: [{
          SucceessMsg: 'Success'
        }]
      }];
    serviceLocator.xmlHandler.generate(response, callback);
  };

  return self;
};