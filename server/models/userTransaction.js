var mongoose = require('mongoose');

var UserTransaction = new mongoose.Schema({

  uId: {type: String},
  dtId: {type: String, default: ''},					// Dwolla transaction id
  bId: {type: String, default: ''},						// Bid Id
  hId: {type: String, default: ''},						// House Id
  noShare: {type: String},										// Number Of Share
  amt: {type: String},												// Amount
  state: {type: Number, default: 0},					// 0 In-progress, 1 Completed
  cAt: {type: Date, default: Date.now()}    	// Transaction Created At

});

module.exports = mongoose.model('uTransaction', UserTransaction);