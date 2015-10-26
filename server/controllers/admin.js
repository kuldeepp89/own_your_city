'use strict';

var util = require('util');
var _ = require('lodash');
var async = require('async');
var passport = require('passport');
var Bid = require('../models/bid');
var House = require('../models/house');
var User = require('../models/user');
var Transaction = require('../models/userTransaction');
var AdminCtl = module.exports;
var commonFunc = require('./commonFunc');
var moment = require('moment');


// =============================================================================
// GET FOR ADMIN LOGIN ---------------------------------------------------------
// -----------------------------------------------------------------------------

AdminCtl.getLogin = function(req, res){
  res.render('admin/login');
};

// =============================================================================

// =============================================================================
// POST FOR ADMIN LOGIN --------------------------------------------------------
// -----------------------------------------------------------------------------

AdminCtl.postLogin = function(req, res, next) {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/adminlogin');
  }

  passport.authenticate('local', function(err, user, info) {
    if (err) return next(err);
    if (!user) {
      req.flash('errors', { msg: info.message });
      return res.redirect('/adminlogin');
    }
    req.logIn(user, function(err) {
      if (err) return next(err);
      if(user.mata.isAdmin){
        req.flash('success', { msg: 'Success! You are logged in.' });
        res.redirect('/addhouse');
      }
      else {
        req.flash('success', { msg: 'Failed! Wrong email or password.' });
        return res.redirect('/adminlogin');
      }
    });
  })(req, res, next);
};

// =============================================================================

//Get User List
AdminCtl.getUserList = function(req, res){
  User.find({'mata.isAdmin': false}, function(err, user) {
    if(err)
      cosole.log(err);
    commonFunc.getInprogressInvestment(user._id, function(data) {                  
      res.render('admin/user_list', {
        topbarBrand: 'Own Your City',
        title: 'User List',
        users: user,
        sidebar: data,
        isAdmin: req.user.mata.isAdmin
      });                
    })
  })
};

// =============================================================================
//Get Activity Summary
AdminCtl.getActivitySummary = function(req, res){
  House.count({$where: "this.numberOfShare == this.soldShare"}, function(err, pCount) {
    if(err) console.log(err);
    User.count({'mata.isAdmin': false}, function(err, uCount) {
      if(err) console.log(err);
      Transaction.distinct('uId', {'state': 1},   function(err, tCount) {
        console.log(tCount);
        if(err) console.log(err);
        Transaction.find({'state': 1}, {amt: 1}, function(err, amount) {
          if(err) console.log(err);
          var totalAmount = 0;
          var bCount = amount.length;
          for(var i in amount) {
            totalAmount = parseInt(totalAmount)  + parseInt(amount[i].amt);
          } 
          var tDate = new Date();
          var date = tDate.getFullYear() + '-' + (parseInt(tDate.getMonth()) + parseInt(1)) + '-' + tDate.getDate();
          console.log(date);
          Transaction.find({'state': 1, 'cAt':{$gt: new Date(date)}}, {}, function(err, Houses) {
            if(err) console.log(err);
            console.log("House" + Houses);
            var todayAmount = 0;
            var todayTransaction = 0;
            for (i in Houses) {
              todayAmount = todayAmount + parseInt(Houses[i].amt);  
              todayTransaction = todayTransaction + 1;
            }
            Transaction.distinct('hId', {'state': 1, 'cAt':{$gt: new Date(date)}}, function(err, activeHouse) {
              if (err) console.log(err);
              console.log("Active Houses" + activeHouse);
              var houseIds = _.map(Houses, function(Houses){
                return [Houses.hId]
              });
              var start = [], end = [];
              start.push((moment().subtract('days', 4) .startOf('day')._d),(moment().subtract('days', 3) .startOf('day')._d),(moment().subtract('days', 2) .startOf('day')._d),(moment().subtract('days', 1) .startOf('day')._d));
              end.push((moment().subtract('days', 3) .startOf('day')._d), (moment().subtract('days', 2) .startOf('day')._d), (moment().subtract('days', 1) .startOf('day')._d), (moment().subtract('days', 0) .startOf('day')._d));          
              Transaction.find({'state': 1, 'cAt': {$gt: start[0], $lt: end[0]}}, function(err, transactions1) {
                console.log("transaction:1" + " " +transactions1.length);
                Transaction.find({'state': 1, 'cAt': {$gt: start[1], $lt: end[1]}}, function(err, transactions2) {
                  console.log("transaction:2" +" "+ transactions2.length);
                  Transaction.find({'state': 1, 'cAt': {$gt: start[2], $lt: end[2]}}, function(err, transactions3) {
                    console.log("transaction:3" +" "+ transactions3.length);
                    Transaction.find({'state': 1, 'cAt': {$gt: start[3], $lt: end[3]}}, function(err, transactions4) {
                      console.log("transaction:4" + " " +transactions4.length);
                      Transaction.find({'state': 1, 'cAt': {$gt: new Date(date)}}, function(err, transactions5) {
                        console.log("transaction:5" + " " +transactions5.length);
                        console.log('houseID' + " " + houseIds);
                        House.find({'_id': {$in: houseIds}}, function(err, allHouses){
                          if(err) console.log(err);
                          console.log("allHouses" + allHouses);
                          var transactions = [transactions1.length, transactions2.length, transactions3.length, transactions4.length, transactions5.length ];
                          var pFunded = _.map(allHouses, function(house){
                            return ( ((house.soldShare *100)/house.numberOfShare).toString().slice(0, 5));
                          });
                          console.log(pFunded);
                          console.log(pCount + " "  + uCount + " " + bCount + " "+ tCount.length);
                          res.render('admin/activity_summary', {
                            topbarBrand: 'Own Your City',
                            title: 'Activity Summary',
                            pCounts: pCount,
                            uCounts: uCount,
                            bCounts: bCount,
                            tCounts: tCount.length,
                            totalAmount: totalAmount,
                            isAdmin: req.user.mata.isAdmin,
                            houses: allHouses,
                            todayAmount: todayAmount,
                            todayTransaction: todayTransaction,
                            activeHouse: activeHouse.length,
                            pFunded: pFunded,
                            transactions: transactions
                          });  
                        })  
                      })
                    })
                  })
                })
              })   
            })
          })
        })
      })
    })
  })
}

// =============================================================================
//Get Disable User

AdminCtl.getDisableUser = function(req, res) {
  var id = req.param('id');
  User.findOne({'_id': id}, {}, function(err, user) {
    User.update({'_id': id}, {$set: {'isDisable' : true}}, function(err, success) {
        if(err) console.log(err);
        console.log(success);
        res.redirect('/user/list');
      }
    )
  })
}


// Disable User -------------------------------------------------------
// -----------------------------------------------------------------------------

AdminCtl.getEnableUser = function(req, res) {
  var id = req.param('id');
  User.findOne({'_id': id}, {}, function(err, user) {
    User.update({'_id': id}, {$set: {'isDisable' : false}}, function(err, success) {
        if(err) console.log(err);
        console.log(success);
        res.redirect('/user/list');
      }
    )
  })
}

// =============================================================================


AdminCtl.getTodayActivity = function(req, res) {
  var date = new Date;
  date = date.getDate;
  userTransaction.find({'cAt': date}, {}, function(err, house) {
    console.log(house + 'anything');
    res.render('admin/activity_summary', {
      house: house
    })
  })
}