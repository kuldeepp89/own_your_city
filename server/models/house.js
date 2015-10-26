'use strict';

var mongoose = require('mongoose');

var HouseSchema = new mongoose.Schema({

  images: {
    indexImage: { type: String, default: ''},
    otherImage: [{ type: String, default: ''}]
  },

  city: { type: String, default: ''},

  floorPlanDocument: { type: String, default: ''},

  neighbourHood: { type: String, default: ''},

  houseNumber: { type: String, default: ''},

  streetNumber: { type: String, default: ''},

  pinCode: { type: Number, default: ''},

  typeOfHouse: {
    title: { type: String, default: ''},
    isCondo: { type: Boolean, default: false},
    condoDetails: {
      monthlyFee: { type: Number, default: 0},
      condoDocument: { type: String, default: ''}
    }
  },

  description: { type: String, default: ''},

  ownershipDocument: { type: String, default: ''},

  billDocument: { type: String, default: ''},

  age: { type: Number, default: ''},

  repairAndMaintenanceDocument: { type: String, default: ''},

  renovationDocument: { type: String, default: ''},

  rent: {
    isRent: { type: Boolean, default: false},
    monthlyRent: { type: Number, default: 0},
    rentReceivedDocument: { type: String, default: ''},
    managementDocument: { type: String, default: ''}
  },

  numberOfShare: { type: Number, default: 0},

  costOfShare: { type: Number, default: 0},

  biddingEndDate: { type: String, default: ''},

  soldShare: { type: Number, default: 0},

  createdAt: { type: Date, default: Date.now },

  isDisable: { type: Boolean, default: false}

});

module.exports = mongoose.model('House', HouseSchema);