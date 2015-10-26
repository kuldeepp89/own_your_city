'use strict';

var path = require('path');

module.exports = function(rootPath) {

  var paths = {
    server: path.join(rootPath, 'server'),
    models: path.join(rootPath, 'server', 'models'),
    views: path.join(rootPath, 'server', 'views'),
    controllers: path.join(rootPath, 'server', 'controllers')
  };

  return paths;

};
