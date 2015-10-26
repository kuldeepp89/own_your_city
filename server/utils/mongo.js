'use strict';

var mongo = module.exports = {

  connect: function(mongoose, config, callback) {
    mongoose.disconnect(function(err){
      if(err) { throw err; }
    });

    if(!config.port) {
      config.port = 27017;
    }

    var dbPath;
    dbPath = 'mongodb://';

    if(config.username && config.password) {
      dbPath += config.username + ':' + config.password;
      dbPath += '@' + config.host + ':' + config.port;
    }
    else{
      dbPath += config.hostname + ':' + config.port;
    }

    dbPath += '/' + config.database;

    return mongoose.connect(dbPath, callback);
  },

  cleanModel: function(Model, done) {
    Model.find().remove(function(err) {
      if (err) { throw err; }
      done();
    });
  }

};