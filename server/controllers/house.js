'use strict';

var _ = require('lodash');
var async = require('async');
var mkdirp = require('mkdirp');
var House = require('../models/house');
var RecentView = require('../models/recentViewHouse');
var Transaction = require('../models/userTransaction');
var dwolla = require('dwolla');
var Bid = require('../models/bid');
var User = require('../models/user');
var Dashboard = require('./dashboard');
var fs = require('fs');
var HouseCtl = module.exports;
var commonFunc = require('./commonFunc');

// =============================================================================
// GET ADD HOUSE ---------------------------------------------------------------
// -----------------------------------------------------------------------------

HouseCtl.getAddHouse = function(req, res) {
  if (req.user.mata.isAdmin) {
    return Dashboard.addHouse(req, res)
  }
  else{
    res.redirect('login');
  }
};

// =============================================================================


var ifErr = function(req, res, errorMsg) {
  req.flash('errors', { msg: errorMsg });
  res.redirect('/addhouse');
};


// =============================================================================
// POST FOR ADD HOUSE ----------------------------------------------------------
// -----------------------------------------------------------------------------

HouseCtl.postAddHouse = function(req, res, next) {
  var city = req.param('city');
  var houseNumber = req.param('houseNumber');
  var streetNumber = req.param('streetNumber');
  var pinCode = req.param('pinCode');
  var typeOfHouse = req.param('typeOfHouse');
  var isCondo = (typeOfHouse==='condo');
  var description = req.param('description');
  var isRent = (req.param('isRent')==='on');
  var condoDocument = {}, floorPlanDocument = {},
    ownershipDocument = {}, billDocument = {},
    repairDocument = {}, renovationDocument = {},
    rentRecieveDocument = {}, managementDocument = {};    
  var dir = "../own_your_city/upload/" + city+ "/" + new Date().getTime() + "/";
  dir = dir.split(" ").join('_');
  var imageArray = req.files.index;
  var imagesAt = [];
  console.log(isRent);
  var saveFile = function(requestFile, storeAt, errMsg, callback, fileName) {
    var saveAt = '';
    if ( (typeof requestFile != 'undefined') && (requestFile.originalFilename !=='') ) {
      var name = requestFile.name;
      saveAt = dir + fileName + name.substr(name.lastIndexOf('.'));
      saveAt = storeAt.name = saveAt.replace(' ', '_');
      storeAt.name = storeAt.name.split('../own_your_city')[1];
    }
    else{
      return ifErr(req, res, errMsg);
    }

    if( requestFile.originalFilename !== '' ) {
      fs.rename(requestFile.path, saveAt, function (err){
        if(err) console.log("FILE STORE ERROR " +err );
        console.log("COMPLETED");
        callback();
      });
    }
  }

  var saveHouse = function() {
    var house = new House({
      images: {
        indexImage: '',
        otherImage: imagesAt
      },
      city: city,
      neighbourHood: req.param('neighbourHood'),
      houseNumber: houseNumber,
      streetNumber: streetNumber,
      pinCode: pinCode,
      typeOfHouse: {
        title: typeOfHouse,
        isCondo: isCondo,
        condoDetails: {
          monthlyFee: req.param('monthlyFee'),
          condoDocument: condoDocument.name
        }
      },
      floorPlanDocument: floorPlanDocument.name,
      description: req.param('description'),
      ownershipDocument: ownershipDocument.name,
      billDocument: billDocument.name,
      age: req.param('age'),
      repairAndMaintenanceDocument: repairDocument.name,
      renovationDocument: renovationDocument.name,
      rent: {
        isRent: isRent,
        monthlyRent: req.param('monthlyRent'),
        rentReceivedDocument: rentRecieveDocument.name,
        managementDocument: managementDocument.name
      },
      numberOfShare: req.param('numberOfShare'),
      costOfShare: req.param('costOfShare'),
      biddingEndDate: req.param('biddingEndDate'),
      soldShare: 0
    });
    house.save(function(err) {
      if (err) {
        if (err.code === 11000) {
          req.flash('errors', { msg: 'Some problem is there' });
        }
        req.flash('errors', { msg: 'Some problem is there'});
        return res.redirect('/addhouse');
      }
      res.redirect('/addhouse');
    });
  }

  var saveRentRecieve = function() {
    saveFile(req.files.managementDocument, managementDocument,
      'Management document is missing', saveHouse, 'management'
    );
  }

  var saveRent = function() {
    if(isRent) {
      saveFile(req.files.rentReceivedDocument, rentRecieveDocument,
        'Rent Received Document Is Missing', saveRentRecieve, 'rent'
      );
    }
    else {
      saveHouse();
    }
  }

  var saveCondo = function() {
    saveFile(req.files.renovationDocument, renovationDocument,
      'Renovation Document Is Missing', saveRent, 'renovation'
    );
  }

  var saveRepair = function() {
    if(isCondo) {
      saveFile(req.files.condoDocument, condoDocument,
        'Condo Document Is Missing', saveCondo, 'condo'
      );
    }
    else{
      saveCondo();
    }
  }

  var saveBill = function() {
    saveFile(req.files.repairAndMaintenanceDocument, repairDocument,
      'Repair and maintenance document is missing.', saveRepair, 'repair'
    );
  }

  var saveOwnership = function() {
    saveFile(req.files.billDocument, billDocument,
      "Bill document is missing", saveBill, 'bill'
    );
  };

  var saveFloorPlan = function() {
    saveFile(req.files.ownershipDocument, ownershipDocument,
      "Ownership Document Is Missing", saveOwnership, 'ownership'
    );
  };

  var saveImageArray = function(){
    for(var i in imageArray) {
      if((typeof imageArray[i] != 'undefined') && (imageArray[i].originalFilename !=='') && (imageArray[i].name !== '')) {
        var fileName = imageArray[i].originalFilename;
        var imageName = dir+ "image" + i + fileName.substr(fileName.lastIndexOf('.'));
        imagesAt.push(imageName.split('../own_your_city')[1]);
        fs.rename(imageArray[i].path, imageName, function (err){
          if(err) console.log("IMAGE STORE ERROR " +err );
        });
      }
    }
    saveFile(req.files.floorPlanDocument, floorPlanDocument,
      "Floor Plan Document Is Missing", saveFloorPlan, 'floorplan'
    );
  }

  mkdirp((dir), '0755', function (err) {
    if (err) console.log(" MKDIRP ERROR :: " + err);
    saveImageArray();
  });

};

// =============================================================================


// =============================================================================
// ADMIN GET ALL HOUSE BY CITY NAME --------------------------------------------
// -----------------------------------------------------------------------------

HouseCtl.getAllHouseAdmin = function(req, res){
  var city = req.param('city'),
    page = req.param('page');
  page = parseInt(page);
  var skip = 8 * page;
  House.count({'city': city}, function( err, count){
    House.find({'city': city}, {}, {skip: skip, limit: 8, sort: { 'createdAt': -1 } }, function(err, houses){
      if(err){
        return res.redirect('/back');
      }
      var housesWithTime = _.map(houses, function(house){
        return ([house, commonFunc.dateDiff(house.biddingEndDate), ((house.soldShare *100)/house.numberOfShare).toString().slice(0, 5)]);
      });
      res.render('dashboard/all_house', {
        topbarBrand: 'Own Your City',
        title: city + ' Property',
        page: (page+1),
        houses: housesWithTime,
        city: city,
        isAdmin: req.user.mata.isAdmin,
        numberOfPages: Math.ceil(count/8)
      });
    })    
  });
};
// =============================================================================



// =============================================================================
// USER GET ALL HOUSE BY CITY NAME --------------------------------------------
// -----------------------------------------------------------------------------

HouseCtl.getAllHouseUser = function(req, res){
  var city = req.param('city'),
    page = req.param('page');
  page = parseInt(page);
  var skip = 8 * page;
  House.count({'city': city, 'isDisable': false}, function( err, count){    
    House.find({'city': city, 'isDisable': false}, {}, {skip: skip, limit: 8, sort: { 'createdAt': -1 } }, function(err, houses){
      if(err){
        return res.redirect('/back');
      }
      var housesWithTime = _.map(houses, function(house){
        return ([house, commonFunc.dateDiff(house.biddingEndDate), ((house.soldShare *100)/house.numberOfShare).toString().slice(0, 5)]);
      });
      commonFunc.getInprogressInvestment(req.user._id, function(data) {
          res.render('dashboard/all_house', {
          topbarBrand: 'Own Your City',
          title: city + ' Property',
          page: (page+1),
          houses: housesWithTime,
          city: city,
          numberOfPages: Math.ceil(count/8),
          sidebar: data
        });
      })
    })
  });
};

// =============================================================================



// =============================================================================
// GET RECENT VIEW HOUSES ------------------------------------------------------
// -----------------------------------------------------------------------------

var recentViewHouse = function (userId, houseId) {  
  RecentView.find({'uId': userId}, {}, function(err, uLogs){
    if(err) console.log(err);
    else if(uLogs.length == 0){
      var RecentViewHouse = new RecentView({
        uId: userId,
        rView: {
          hId: [ houseId ]
        },
        bidOn: {},
        buy: {}
      });
      RecentViewHouse.save( function (err, success) {
        if(err) console.log(err);
      });    
    }
    else{
      RecentView.findOne({ 'uId': userId, 'rView.hId': { $in: [ houseId ] } }, {}, function(err, uLogs) {
        RecentView.update({'uId': userId}, {$pull: {'rView.hId': houseId}}, function(err, succ) {
          if(err) console.log(err);
          RecentView.update({'uId': userId}, {$push: { 'rView.hId': houseId } }, function (err, success) {
            if(err) console.log(err);
          });
        });
      });
    }
  });
}

// =============================================================================


// =============================================================================
// GET HOUSE ADMIN -------------------------------------------------------------
// -----------------------------------------------------------------------------

HouseCtl.getHouseAdmin = function (req, res, house) {
  commonFunc.getBidLogByHouseId(house._id, function(data) {
    res.render('dashboard/house_detail', {
      topbarBrand: 'Own Your City',
      title: 'Property Details',
      house: house,
      isAdmin: req.user.mata.isAdmin,
      pFunded: ((house.soldShare *100)/house.numberOfShare).toString().slice(0, 5),
      remainTime: commonFunc.dateDiff(house.biddingEndDate),
      modalData: data
    })
  })
}

// =============================================================================


// =============================================================================
// GET HOUSE USER -------------------------------------------------------------
// -----------------------------------------------------------------------------

HouseCtl.getHouse = function(req, res) {
  var args = arguments[2] || {};
  var id = req.param('id') || args.hId;
  House.findOne({'_id': id}, {}, function (err, house) {
    var userId = req.user._id;
    recentViewHouse(userId, id);
    var token = req.user.token;
    if(token){
      args.token = token
    }
    if(req.user.mata.isAdmin){
      HouseCtl.getHouseAdmin(req, res, house)
    }
    else{
      commonFunc.getInprogressInvestment(userId, function(data) {
        res.render('dashboard/house_detail', {
          topbarBrand: 'Own Your City',
          title: 'Property Details',
          house: house,
          isAdmin: req.user.mata.isAdmin,
          pFunded: ((house.soldShare *100)/house.numberOfShare).toString().slice(0, 5),
          remainTime: commonFunc.dateDiff(house.biddingEndDate),
          sidebar: data,
          args: args
        })
      })
    }
  });
};
// =============================================================================

// =============================================================================
// POST EDIT BID DATE ----------------------------------------------------------
// -----------------------------------------------------------------------------

HouseCtl.editBidDate = function(req, res) {
  var hId = req.param('id');  
  House.findOne({'_id': hId}, {}, function (err, house) {
    if(err) console.log(err);
    var isEditable = function(newDate, oldDate) {
      var oldDateWidTime = oldDate.split('-');
      var od1 = new Date(oldDateWidTime[0]);
      var delay1 = od1.getFullYear()+'/'+(parseInt(od1.getMonth()+ 1))+'/'+(od1.getDate());
      return commonFunc.dateDiff(newDate, delay1 + " "+ oldDateWidTime[1])
    }
    console.log(isEditable(req.param('biddingEndDate'), house.biddingEndDate));
    if(isEditable(req.param('biddingEndDate'), house.biddingEndDate) < 1){
      req.flash('errors', 'You can not set old time.');
      House.findOne({'_id': hId}, {}, function (err, house) {
        getHouseAdmin(req, res, house)
      });
    }
    else{
      House.update({'_id': hId}, {$set:{ 'biddingEndDate': req.param('biddingEndDate') }}, function (err, isUpdated) {
        if(isUpdated){
          req.flash('success', 'Successfully updated.');
          House.findOne({'_id': hId}, {}, function (err, house) {
            getHouseAdmin(req, res, house)
          });
        }
        else{
          req.flash('errors', 'Unable to update date.');
          House.findOne({'_id': hId}, {}, function (err, house) {
            getHouseAdmin(req, res, house)
          });
        }
      });
    }
  });
};
// =============================================================================


// =============================================================================
// POST BUY HOUSE --------------------------------------------------------------
// -----------------------------------------------------------------------------

var setTransaction = function (userId, succId, noShare, amtPaid, hId, dtId, req, res){
  Transaction.findOne({'uId': userId, 'hId': hId, 'state': 0},
   {}, function(err, transaction){
    if(err) console.log(err);                            
    transaction.bId = succId;
    transaction.noShare = noShare;
    transaction.amt = amtPaid;
    transaction.hId = hId;
    transaction.dtId = dtId,
    transaction.cAt = new Date(),
    transaction.state = 1;
    transaction.save(function(err, success) {
      if(err) console.log(err);      
      req.flash('success', 'You have share.')
      return res.redirect('/dashboard')
    })
  });
}

HouseCtl.postBuyHouse = function(req, res){  
  var hId = req.param('id')
  var purchaseShare = parseInt(req.param('purchaseShare'));
  var amountUserPaid =  parseInt(req.param('amount'));
  var securityPin = req.param('securityPin');
  if(hId === undefined || hId === ''){
    return res.redirect('/dashboard')
  }
  if(isNaN(amountUserPaid) || isNaN(purchaseShare)){
    return  "Please fill details or enable your javascript."
  }
  else{
    House.findOne({'_id': hId}, {}, function(err, house){      
      if(err) console.log(err);      
      var costOfShare = house.costOfShare;
      var soldShare = house.soldShare,
       totalShare = house.numberOfShare;
      if(isNaN(soldShare)){
        soldShare = 0
      }
      var availableShare = totalShare - soldShare;        
      if(purchaseShare > (availableShare) ){
        req.flash('errors', 'You can not buy more than '+ (totalShare - soldShare) + ' share.')
        return res.redirect('/gethouse/'+hId)
      }
      else if(soldShare==totalShare){
        req.flash('errors', 'Already completly sold.')
        return res.redirect('/gethouse/'+hId)
      }
      else if((soldShare + purchaseShare) > totalShare){
        req.flash('errors', 'You can not buy more than '+ (totalShare - soldShare) + ' share.')
        return res.redirect('/gethouse/'+hId)
      }
      else{
        soldShare = soldShare + purchaseShare;
        var token = req.user.dwolla.token;
        User.update({'_id': req.user._id}, {'dwolla.token': ''}, function(err, success) {
          if(err) console.log(err);
        });
        if((token !== undefined) && (token !== '')) {
          if(securityPin === undefined){
            req.flash('errors', 'Please enter your security pin code. ')
            return res.redirect('/gethouse/'+hId)
          }
          else{
            var destinationId = '812-931-2774';
            dwolla.send(token, securityPin, destinationId, 0.01, {
              notes: 'This transaction made for house ' + hId},
               function(err, dtId) {
              if(err) {
                console.log(err);
                req.flash('errors', err.body.Message)
                return res.redirect('/gethouse/'+hId)
              }
              else{
                House.update({'_id': hId}, {'soldShare': soldShare},
                 function(err, success){
                  if(err) console.log(err);
                  else{
                    var userId = req.user._id;
                    Bid.findOne({ 'uId': userId, 'hId': hId}, {},
                     function(err, uPurchase) {
                      if(!uPurchase){
                        var bid = new Bid({
                          uId: userId,
                          hId: hId,
                          noShare: purchaseShare,
                          amt: amountUserPaid,
                          cba: false
                        });
                        bid.save(function (err, success) {
                          if(err) console.log(err);
                          Transaction.findOne({'uId': userId, 'hId': hId, 'state': 0},
                           {}, function(err, transaction){
                            if(err) console.log(err);                            
                            setTransaction(userId, success._id, purchaseShare,
                             amountUserPaid, hId, dtId, req, res
                            )
                          });
                        });
                      }
                      else{
                        Bid.update({'uId': userId, 'hId': hId}, {$set: {
                          'noShare' : (uPurchase.noShare + purchaseShare),
                          'amt': (uPurchase.amt + amountUserPaid)
                          }}, function (err, success) {
                            if (err) console.log(err);
                            setTransaction(userId, success._id, purchaseShare,
                             amountUserPaid, hId, dtId, req, res
                            )
                        });
                      }
                    })
                  }
                });
              }
            });
          }
        }
        else{
          var transaction = new Transaction({
            uId: req.user.id,
            hId: hId,
            noShare: purchaseShare,
            amt: amountUserPaid,

          });
          transaction.save(function(err, success) {
            if(err) console.log(err);
            res.render('user/redirect_to_dwolla');
          });
        }
      }
    });
  }
}
// =============================================================================

// =============================================================================
// CONTINUE PURCHASE HOUSE -----------------------------------------------------
// -----------------------------------------------------------------------------

HouseCtl.redirectToDwolla = function(req, res) {
  return res.redirect('/auth/dwolla');
}

HouseCtl.continuePurchase = function(req, res){
  var userId = req.user._id;
  RecentView.findOne({ 'uId': userId}, {}, function(err, uLogs) {
    Transaction.findOne({'uId': userId, 'hId': uLogs.rView.hId[uLogs.rView.hId.length - 1],
     'state': 0}, {}, {sort:{'cAt': -1}}, function(err, transaction){
      if(err) console.log(err);
      HouseCtl.getHouse(req, res, transaction);    
    });
  })
}
// =============================================================================

// =============================================================================
// DISABLE HOUSE IN VIEW -------------------------------------------------------
// -----------------------------------------------------------------------------

HouseCtl.disableHouse = function(req, res) {
  var id = req.param('id')
  House.findOne({'_id': id}, {}, function(err, house) {
    House.update({'_id': id}, {$set: {
      'isDisable' : true
      }}, function(err, success) {
        if(err) console.log(err);
        console.log(success);
        res.redirect('/gethouse/' + id)
      }
    )
  })
}

// =============================================================================

// =============================================================================
// ENABLE HOUSE IN VIEW -------------------------------------------------------
// -----------------------------------------------------------------------------

HouseCtl.enableHouse = function(req, res) {
  var id = req.param('id')
  House.findOne({'_id': id}, {}, function(err, house) {
    House.update({'_id': id}, {$set: {
      'isDisable' : false
      }}, function(err, success) {
        if(err) console.log(err);
        console.log(success);
        res.redirect('/gethouse/' + id)
      }
    )
  })
}

// =============================================================================