var mongoose = require('mongoose');

var Bid = new mongoose.Schema({
  uId: {type: String},												//User Id
  hId: {type: String},												//House Id
  noShare: {type: Number},                    //Number Of Share
  amt: {type: Number},                        //Amount which user invest
  bidOn: {type: Boolean, default: true},      //Bid in progress
  pAt: {type: Date, default: Date.now()},     //Purchased At
  cba: {type: Boolean, default: false}					//Completed By Admin
});

module.exports = mongoose.model('Bid', Bid);