'use strict';

var dashboard = module.exports;
var _ = require('lodash');
var UserLog = require('../models/recentViewHouse');
var House = require('../models/house');
var Bid = require('../models/bid');
var commonFunc = require('./commonFunc');

var orderIngBids = function(house, bid){  
  var bidOn = [], indexOn = 0;
  var bidProgress = [], indexOff = 0;
  var bidCancel = [], cancel = 0;
  var bidCompleted = [], complete = 0;
  var inProgressInvestment = 0;
  for(var i in house){
    for(var j in bid){
      var currHouse = house[i];
      if(currHouse._id == bid[j].hId){
        if(commonFunc.dateDiff(currHouse.biddingEndDate) > 0 && (currHouse.numberOfShare > currHouse.soldShare) && bid[j].cba != true){
          inProgressInvestment = inProgressInvestment + bid[j].amt
          bidOn[indexOn] = [currHouse, bid[j].noShare, ((currHouse.soldShare * 100)/currHouse.numberOfShare).toString().slice(0,5) ];
          indexOn = indexOn +1;          
        }
        else if((currHouse.numberOfShare === currHouse.soldShare) && bid[j].cba == true){
          bidCompleted[complete] = [currHouse, bid[j].noShare, ((currHouse.soldShare * 100)/currHouse.numberOfShare).toString().slice(0,5) ];
          complete = complete + 1 ;
        }
        else if((currHouse.numberOfShare === currHouse.soldShare)){
          bidProgress[indexOff] = [currHouse, bid[j].noShare, ((currHouse.soldShare * 100)/currHouse.numberOfShare).toString().slice(0,5) ];
          indexOff = indexOff +1;
        }
        else{
          bidCancel[cancel] = [currHouse, bid[j].noShare, ((currHouse.soldShare * 100)/currHouse.numberOfShare).toString().slice(0,5) ];
          cancel = cancel + 1;
        }
        break;
      }
    }
  }
  return [bidOn, bidProgress, bidCancel, inProgressInvestment, bidCompleted];
}

var orderIngRviews = function(houses, hids){
  var orderData = [];
  var hids = hids.reverse().slice(0, 5)
  for(var i in hids){
    for(var j in houses){      
      if(houses[j]._id == hids[i]){
        var currHouse = houses[j];        
        orderData[i] = [currHouse, ((currHouse.soldShare * 100)/currHouse.numberOfShare).toString().slice(0,5)];
        break;
      }
    }
  }
  return orderData;
}


// =============================================================================
// GET DASHBOARD ---------------------------------------------------------------
// -----------------------------------------------------------------------------
dashboard.index = function(req, res) {
  if(req.user.mata.isAdmin){
    return res.redirect('/addhouse');
  }
  else{
    var userId = req.user._id;
    UserLog.findOne({'uId': req.user._id}, {}, { $orderby: { 'rView.hId' : -1 } }, function(err, uLogs) {
      if(err) console.log(err);
      Bid.find({'uId': userId}, {hId: 1,noShare: 1, amt: 1, _id: -1, cba: 1}, {$orderby: {'pAt': 1}},function(err, bids) {
        if(err) console.log(err);
        else{          
          var houseIds = _.map(bids, function(bid){
            return [bid.hId]
          });
          House.find({'_id': {$in: houseIds}}, {}, function(err, bidHouses) {            
            var orderData = orderIngBids(bidHouses, bids);
            if(err) console.log(err);
            if(!uLogs){
              commonFunc.getInprogressInvestment(userId, function(data) {
                res.render('user/dashboard', {
                  topbarBrand: 'Own Your City',
                  title: 'Dashboard',
                  bidHouses: orderData,
                  sidebar: data
                });
              })
            }
            else{
              House.find({'_id': { $in: uLogs.rView.hId }}, {}, function(err,  houses) {  
                if(err) console.log(err);
                commonFunc.getInprogressInvestment(userId, function(data) {                  
                  res.render('user/dashboard', {
                    topbarBrand: 'Own Your City',
                    title: 'Dashboard',
                    houses: orderIngRviews(houses, uLogs.rView.hId),
                    bidHouses: orderData,
                    sidebar: data
                  });                
                })
              });
            }
          })          
        }
      })
    });
  }
};

// =============================================================================


// =============================================================================
// GET ADD ADD HOUSE -----------------------------------------------------------
// -----------------------------------------------------------------------------

dashboard.addHouse = function(req, res) {
  res.render('admin/dashboard', {
    topbarBrand: 'Own Your City',
    title: 'Upload House',
    isAdmin: req.user.mata.isAdmin
  });
};

// ============================================================================
