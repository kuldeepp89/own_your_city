var mongoose = require('mongoose');

var RecentViewHouses = new mongoose.Schema({

  uId: { type: String },                          //User Ids
  
  rView: {
    hId: [{type: String}]                         //House Ids
  }

});

module.exports = mongoose.model('RvHouses', RecentViewHouses);