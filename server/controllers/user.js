'use strict';


var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var User = require('../models/user');
var config = require('../config')("");
var commonFunc = require('./commonFunc');
var UserCtl = module.exports;
var mkdirp = require('mkdirp');
var fs = require('fs');

// =============================================================================
// Login page ------------------------------------------------------------------
// -----------------------------------------------------------------------------
/**
 * GET /auth/Login
 * SignIn page.
 */
UserCtl.getLogin = function(req, res) {
  if(req.user !== undefined){
    if(req.user.mata.isAdmin){
      return res.redirect('/addhouse');
    }
    else if(req.user.isDisable){
      req.flash('errors', { msg: 'Your Account has been blocked.Please Contact Admin' });
      return res.render('user/login');
    }
    else {
      return res.redirect('/dashboard');
    }
  }
  res.render('user/login', {
    topbarBrand: 'Own Your City',
    title: 'LogIn'
  });
};
// =============================================================================

// =============================================================================
// Login post for local login --------------------------------------------------
// -----------------------------------------------------------------------------
/**
 * POST /auth/login
 * Log in using email and password.
 * @param email
 * @param password
 */
UserCtl.postLogin = function(req, res, next) {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/login');
  }

  passport.authenticate('local', function(err, user, info) {
    if (err) return next(err);
    if (!user) {
      req.flash('errors', { msg: info.message });
      return res.redirect('/login');
    }
    req.logIn(user, function(err) {
      if (err) return next(err);
      if(user.mata.isAdmin){
        return res.redirect(req.session.returnTo || '/addhouse');
      }
      else{
        return res.redirect(req.session.returnTo || '/dashboard');
      }
    });
  })(req, res, next);

};
// =============================================================================

// =============================================================================
// Logout ------------------------------------------------------------------
// -----------------------------------------------------------------------------
/**
 * GET /auth/logout
 * Log out.
 */
UserCtl.getLogout = function(req, res) {
  req.logout();
  res.redirect('/');
};
// =============================================================================

// =============================================================================
// Register page ------------------------------------------------------------------
// -----------------------------------------------------------------------------
/**
 * GET /auth/register
 * Signup page.
 */
UserCtl.getRegister = function(req, res) {
  if (req.user) return res.redirect('/');
  res.render('user/register', {
    topbarBrand: 'Own Your City',
    title: 'Register Account'
  });
};
// =============================================================================

// =============================================================================
// Post for local register -----------------------------------------------------
// -----------------------------------------------------------------------------
/**
 * POST /auth/register
 * Create a new local account.
 * @param email
 * @param password
 */
UserCtl.postRegister = function(req, res, next) {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
  req.assert('age', 'Age should be in number').isInt();

  var errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/register');
  }

  var user = new User({
    local: {
      email: req.body.email,
      password: req.body.password
    },
    profile: {
      name: req.body.name,
      age: req.body.age,
      gender : req.body.gender
    }
  });

  user.save(function(err) {
    if (err) {
      if (err.code === 11000) {
        req.flash('errors', { msg: 'User with that email already exists.' });
      }
      return res.redirect('/register');
    }

    req.logIn(user, function(err) {
      if (err) return next(err);
      res.redirect('/');
    });
  });
};
// =============================================================================

// =============================================================================
// Get forgot password page ----------------------------------------------------
// -----------------------------------------------------------------------------
/**
 * GET /forgot
 * Forgot Password page.
 */
exports.getForgot = function(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('user/forgot_password', {
    title: 'Forgot Password',
    topbarBrand: 'Own Your City'
  });
};
// =============================================================================

// =============================================================================
// Post forgot password -------------------------------------------------------
// -----------------------------------------------------------------------------
/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 * @param email
 */
UserCtl.postForgot = function(req, res, next) {
  req.assert('email', 'Please enter a valid email address.').isEmail();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/forgot');
  }

  async.waterfall([
    function(done) {
      crypto.randomBytes(16, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ 'local.email': req.body.email.toLowerCase() }, function(err, user) {
        if (!user) {
          req.flash('errors', { msg: 'No account with that email address exists.' });
          return res.redirect('/forgot');
        }

        user.keys.resetPasswordToken = token;
        user.keys.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport('SMTP', {
        service: 'Gmail',
        auth: {
          user: config.secrets.nodeMailer.gmail.email,
          pass: config.secrets.nodeMailer.gmail.password
        }
      });
      var mailOptions = {
        to: user.local.email,
        from: 'ownyourcity.dummy@gmail.com',
        subject: 'Own Your City - Password Reset',
        text: 'You are receiving this email because you (or someone else) ' +
          'have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your' +
          'browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your' +
          'password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('info', { msg: 'An e-mail has been sent to ' + user.email + ' with further instructions.' });
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
};
// =============================================================================

// =============================================================================
// Get reset password page -------------------------------------------------------
// -----------------------------------------------------------------------------
/**
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = function(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }

  User
    .findOne({ 'keys.resetPasswordToken': req.params.token })
    .where('keys.resetPasswordExpires').gt(Date.now())
    .exec(function(err, user) {
      if (!user) {
        req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
        return res.redirect('/forgot');
      }
      res.render('user/reset_password', {
        topbarBrand: 'Own Your City',
        title: 'Reset Password'
      });
    });
};
// =============================================================================

// =============================================================================
// Post reset password ---------------------------------------------------------
// -----------------------------------------------------------------------------
/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = function(req, res, next) {
  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('confirmPassword', 'Passwords must match.').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  async.waterfall([
    function(done) {
      User
        .findOne({ 'keys.resetPasswordToken': req.params.token })
        .where('keys.resetPasswordExpires').gt(Date.now())
        .exec(function(err, user) {
          if (!user) {
            req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
            return res.redirect('back');
          }

          user.local.password = req.body.password;
          user.keys.resetPasswordToken = undefined;
          user.keys.resetPasswordExpires = undefined;

          user.save(function(err) {
            if (err) return next(err);
            req.logIn(user, function(err) {
              done(err, user);
            });
          });
        });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport('SMTP', {
        service: 'Gmail',
        auth: {
          user: config.secrets.nodeMailer.gmail.email,
          pass: config.secrets.nodeMailer.gmail.password
        }
      });
      var mailOptions = {
        to: user.local.email,
        from: 'ownyourcity.dummy.com',
        subject: 'Own Your City - Password changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' +
          user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', { msg: 'Success! Your password has been changed.' });
        done(err);
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/login');
  });
};
// =============================================================================

// =============================================================================
// Get edit profile page -------------------------------------------------------
// -----------------------------------------------------------------------------
/**
 * Get dashbaord/edit/profile
 */
UserCtl.getProfileEdit = function(req, res) {
  commonFunc.getInprogressInvestment(req.user._id, function(data) {
    res.render('dashboard/profile_edit', {
      topbarBrand: 'Own Your City',
      title: 'Edit Profile',
      isAdmin: req.user.mata.isAdmin,
      sidebar: data
    })
  })
};
  
// =============================================================================

// =============================================================================
// Post edit profile -----------------------------------------------------------
// -----------------------------------------------------------------------------
/**
 * POST /edit/profile
 * Edit profile information.
 */
UserCtl.postProfileEdit = function(req, res, next) {
  if(req.files.pic.size) {
    var oldPath = req.files.pic.path;
    var newPath = './upload/user/images/' + req.files.pic.name;

    mkdirp(('../own_your_city/upload/user/images/'), '0755', function (err) {
      if (err) console.log(" MKDIRP ERROR :: " + err);
      fs.rename(oldPath, newPath, function(err) {
        if (err) throw err;
          fs.unlink(oldPath, function() {
            if (err) throw err;
            fs.readFile(newPath, "binary", function(error, file) {
              if(error) {
                res.send(error + "\n");
              }
              
            })
          });
      });
    });  

    User.findById(req.user.id, function(err, user) {
      if (err) return next(err);
      user.profile.name = req.body.name || '';
      user.profile.gender = req.body.gender || '';
      user.profile.location = req.body.location || '';
      user.profile.age = req.body.age || 0;
      user.profile.picture = '/upload/user/images/' + req.files.pic.name || '';
      user.save(function(err) {
        if (err) return next(err);
        req.flash('success', { msg: 'Profile information updated.' });
        res.redirect('dashboard/profile/edit');
      });
    });
  }
  else {
    User.findById(req.user.id, function(err, user) {
      if (err) return next(err);
      user.profile.name = req.body.name || '';
      user.profile.gender = req.body.gender || '';
      user.profile.location = req.body.location || '';
      user.profile.age = req.body.age || 0;

      user.save(function(err) {
        if (err) return next(err);
        req.flash('success', { msg: 'Profile information updated.' });
        res.redirect('dashboard/profile/edit');
      });
    });
  }
};
/**
 * GET /home
 * Home page.
 */
UserCtl.getHome = function(req, res) {
  res.render('dashboard/home', {
    topbarBrand: 'Own Your City',
    title: 'Home',
    isAdmin: req.user.mata.isAdmin
  });
};

