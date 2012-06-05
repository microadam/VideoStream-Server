var properties = {
  conversionInProgressPath: '/path/to/in-progress',
  conversionCompletePath: '/path/to/complete',
  imageCachePath: '/path/to/images',
  mediaFolders: {
    "Films": '/path/to/films',
    "Shows": '/path/to/shows'
  }
};

module.exports.getProperties = function() {
  return properties;
};