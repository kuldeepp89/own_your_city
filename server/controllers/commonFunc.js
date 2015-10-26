'use strict';


var _ = require('lodash');
var User = require('../models/user');
var Bid = require('../models/bid');
var House = require('../models/house');
var moment = require('moment');
var CommonFunc = module.exports;



var dateDiff = CommonFunc.dateDiff = function(oldDate, now){
  if(now === undefined){
    now = moment();
  }
  else{
    now = moment(now);
  }
  var dateWidTime = oldDate.split('-');
  var od = new Date(dateWidTime[0]);
  var delay = od.getFullYear()+'/'+(parseInt(od.getMonth()+ 1))+'/'+od.getDate();
  return (moment(delay + " "+ dateWidTime[1]).diff(now))/(1000*60*60*24);
}

var getInvestment = function(house, bids){
  var now = new Date();
  now = new Date(now.getMonth()+1 + '-' + now.getDate() + '-' + now.getFullYear());
  var inProgress = 0;
  var inProgressInvestment = 0;
  var compInvest = 0, comp = 0;
  for(var i in house){
    for(var j in bids){
      var currHouse = house[i];
      if(currHouse._id == bids[j].hId){
        if(dateDiff(currHouse.biddingEndDate, now) > 0 && (currHouse.numberOfShare !== currHouse.soldShare) && bids[j].cba != true){
          inProgressInvestment = inProgressInvestment + bids[j].amt
          inProgress = inProgress +1;
        }
        else if(dateDiff(currHouse.biddingEndDate, now) <= 0 && (currHouse.numberOfShare === currHouse.soldShare) && bids[j].cba != true){
          inProgressInvestment = inProgressInvestment + bids[j].amt
        }
        else if((currHouse.numberOfShare === currHouse.soldShare) && bids[j].cba == true){
          console.log(bids[j].amt);
          compInvest = compInvest + bids[j].amt
          comp = comp + 1 ;
        }
        break;
      }
    }
  }
  console.log(inProgressInvestment + " :: " + compInvest + " ::: " + inProgress + "  ::  :: " + comp);
  return [inProgressInvestment + compInvest, inProgress, comp]
}

CommonFunc.getInprogressInvestment = function(userId, cb){  
  var data = Bid.find({'uId': userId}, {hId: 1,noShare: 1, amt: 1, cba: 1}, {$orderby: {'pAt': 1}},function(err, bids) {
    if(err) console.log(err);
    var houseIds = _.map(bids, function(bid){
      return [bid.hId]
    });
    console.log(houseIds);
    House.find({'_id': {$in: houseIds}}, {}, function(err, house) {
      if(err) console.log(err);
      cb(getInvestment(house, bids))
    });
  });
}

CommonFunc.getBidLogByHouseId = function(houseId, cb) {
  Bid.find({'hId': houseId}, {uId: 1, hId: 1,noShare: 1, amt: 1, cba: 1}, function(err, bids) {
    if(err) console.log(err);
    var userIds = _.map(bids, function(bid) {
      return bid.uId
    });
    User.find({'_id': {$in: userIds}}, {profile: 1}, function(err, users) {
      var bidWidUser = [];
      for(var i = 0; i < bids.length; i++){
        for(var j = 0; j < users.length; j++){
          if(bids[i].uId == users[j]._id){
            bidWidUser.push([users[j].profile.name, bids[i]])
            break
          }
        }
      }
      cb(bidWidUser)
    })
  });
}

