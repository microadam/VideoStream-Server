module.exports.create = function(serviceLocator) {
  var self = {};

  self.authenticate = function(data, callback) {
    var authResponse = [{
      name: 'VideoStream',
      children: [{
        SessionID: '1CD6D6D11DD7E79',
        LookupName: '45802e87460c050371b2ba70d4f529d1',
        VideoSegmentLength: '5',
        ServerVersion: '1.0.3.1'
      }]
    }];
    serviceLocator.xmlHandler.generate(authResponse, callback);
  };

  return self;
};