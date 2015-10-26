'use strict';


var _ = require('lodash');
var User = require('../models/user');
var Bid = require('../models/bid');
var House = require('../models/house');
var HouseCtl = require('./house');
var moment = require('moment');
var BidCtl = module.exports;

BidCtl.verifyBid = function(req, res) {
	var bidId = req.param('bidid');
	var hId = req.param('hid');
	Bid.update({'_id': bidId}, {$set: {'cba': true}}, function(err, update) {
		if(err) console.log(err);
		if(update){
          req.flash('success', 'Successfully verified.');
          House.findOne({'_id': hId}, {}, function (err, house) {
            HouseCtl.getHouseAdmin(req, res, house)
          });
        }
        else{
          req.flash('errors', 'Unable to verify.');
          House.findOne({'_id': hId}, {}, function (err, house) {
            HouseCtl.getHouseAdmin(req, res, house)
          });
        }
	})
}