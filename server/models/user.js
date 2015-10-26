'use strict';

var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

var UserSchema = new mongoose.Schema({

  local: {
    email: { type: String, lowercase: true, index: { unique: true, sparse: true }},
    password: String
  },

  facebook: {
    id: String,
    token: String,
    email: String,
    name: String
  },

  linkedin: {
    id: String,
    token: String,
    email: String,
    name: String
  },

  dwolla: {
    id    : { type: String, default: '' },
    token : { type: String, default: '' },
    name  : { type: String, default: '' }
  },

  profile: {
    name: { type: String, default: '' },
    age: { type: Number, default: 0 },
    gender: { type: String, default: '' },
    location: { type: String, default: '' },
    website: { type: String, default: '' },
    picture: { type: String, default: '' }
  },

  keys: {
    resetPasswordToken: String,
    resetPasswordExpires: Date
  },

  mata: {
    isVerified: { type: Boolean, default: false },
    isEnabled: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    lastLogin: { type: Date },
    joinedAt: { type: Date, default: Date.now }
  },
  isDisable: {type: Boolean, default: false}

});

/**
 * Hash the password for security.
 * "Pre" is a Mongoose middleware that executes before each user.save() call.
 */
UserSchema.pre('save', function(next) {
  console.log("UserSchema pre save :: Started");
  var user = this;

  if (!user.isModified('local.password')) return next();

  console.log("UserSchema pre save :: Starting");
  bcrypt.genSalt(5, function(err, salt) {
    console.log("UserSchema pre save :: Bcrypt gensalt callback");
    if (err) return next(err);
    bcrypt.hash(user.local.password, salt, null, function(err, hash) {
      console.log("UserSchema pre save :: Bcrypt hash callback");
      if (err) return next(err);
      user.local.password = hash;
      console.log("UserSchema pre save :: Bcrypt hash callback done");
      next();
    });
  });
});

/**
 * Validate user's password.
 * Will be Used by Passport-Local Strategy for password validation.
 */
UserSchema.methods.validatePassword = function(cPassword, callback) {
  bcrypt.compare(cPassword, this.local.password, function(err, isMatch) {
    if (err) return callback(err);
    callback(null, isMatch);
  });
};

/**
 * Initially we will be using gravatar for user images
 * Get URL to a user's gravatar.
 * Used in Navbar and Account Management page.
 */
UserSchema.methods.gravatar = function(size, defaults) {
  if (!size) size = 200;
  if (!defaults) defaults = 'retro';

  var gUrl = 'https://gravatar.com/avatar/';

  if (!this.local.email) {
    return gUrl + '?s=' + size + '&d=' + defaults;
  }

  var md5 = crypto.createHash('md5').update(this.local.email);
  return gUrl + md5.digest('hex').toString() + '?s=' + size + '&d=' + defaults;
};

module.exports = mongoose.model('User', UserSchema);