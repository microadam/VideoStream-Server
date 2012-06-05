var jsonToXml = require('jsontoxml');

module.exports.create = function(serviceLocator) {
  var self = {};

  self.generate = function(json, callback) {
    var xml = jsonToXml.obj_to_xml(json);
    callback(xml);
  };

  return self;
};