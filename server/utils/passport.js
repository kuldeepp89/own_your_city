'use strict';

var _ = require('lodash');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var DwollaStrategy = require('passport-dwolla').Strategy;
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;


var User = require('../models/user');
var secrets = require('../config/secrets');

// =============================================================================
// User Serialiation -----------------------------------------------------------
// -----------------------------------------------------------------------------
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
// =============================================================================

// =============================================================================
// Signin Required middleware --------------------------------------------------
// -----------------------------------------------------------------------------
exports.isAuthenticated = function(req, res, next) {
  if (req.isAuthenticated() && !req.user.isDisable) return next();
  res.redirect('/login');
};
// =============================================================================

// =============================================================================
// Authorization Required middleware -------------------------------------------
// -----------------------------------------------------------------------------
exports.isAuthorized = function(req, res, next) {
  var provider = req.path.split('/').slice(-1)[0];
  if (_.findWhere(req.user.tokens, { kind: provider })) next();
  else res.redirect('/auth/' + provider);
};
// =============================================================================

// =============================================================================
// Local Login --------------------------------------------------------------
// -----------------------------------------------------------------------------
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  function(email, password, done) {
    User.findOne({ 'local.email': email }, function(err, user) {
      if (!user) {
        return done(null, false, { message: 'Invalid email.. or password.' });
      }
      user.validatePassword(password, function(err, isMatch) {
        if (isMatch) {
          return done(null, user);
        }
        else {
          return done(null, false, { message: 'Invalid email or password.' });
        }
      });
    });
  }));
// =============================================================================

/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id or email.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it's a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user's email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */

// =============================================================================
// Linkedin Login --------------------------------------------------------------
// -----------------------------------------------------------------------------
passport.use(new LinkedInStrategy({
    clientID: secrets.linkedin.clientID,
    clientSecret: secrets.linkedin.clientSecret,
    callbackURL: secrets.linkedin.callbackURL,
    scope: secrets.linkedin.scope,
    passReqToCallback: secrets.linkedin.passReqToCallback
  },
  function(req, accessToken, refreshToken, profile, done) {
    if (req.user) {
      User.findOne({ $or: [
        { 'linkedin.id': profile.id },
        { 'linkedin.email': profile._json.emailAddress }
      ] }, function(err, existingUser) {
        if (existingUser) {
          req.flash('errors', {
            msg: 'There is already a LinkedIn account that belongs to you.Sign ' +
              'in with that account or delete it, then link it with your current account.'
          });
          done(err);
        }
        else {
          User.findById(req.user.id, function(err, user) {
            user.linkedin.id = profile.id;
            user.linkedin.token = accessToken;
            user.linkedin.email = profile._json.emailAddress;
            user.linkedin.name = profile.displayName;
            user.profile.name = user.profile.name || profile.displayName;
            user.profile.location = user.profile.location || profile._json.location.name;
            user.profile.picture = user.profile.picture || profile._json.pictureUrl;
            user.profile.website = user.profile.website || profile._json.publicProfileUrl;
            user.save(function(err) {
              req.flash('info', { msg: 'LinkedIn account has been linked.' });
              done(err, user);
            });
          });
        }
      });
    }
    else {
      User.findOne({ 'linkedin.id': profile.id }, function(err, existingUser) {
        if (existingUser) return done(null, existingUser);
        User.findOne({ 'linkedin.email': profile._json.emailAddress }, function(err, existingEmailUser) {
          if (existingEmailUser) {
            req.flash('errors', {
              msg: 'There is already an account using this email address. Sign ' +
                'in to that account and link it with LinkedIn manually from Account Settings.'
            });
            done(err);
          }
          else {
            var user = new User();
            user.linkedin.id = profile.id;
            user.linkedin.token = accessToken;
            user.linkedin.email = profile._json.emailAddress;
            user.linkedin.name = profile.displayName;
            user.profile.name = user.profile.name || profile.displayName;
            user.profile.location = user.profile.location || profile._json.location.name;
            user.profile.picture = user.profile.picture || profile._json.pictureUrl;
            user.profile.website = user.profile.website || profile._json.publicProfileUrl;
            user.save(function(err) {
              done(err, user);
            });
          }
        });
      });
    }
  }));
// =============================================================================

// =============================================================================
// Dwolla Login ----------------------------------------------------------------
// -----------------------------------------------------------------------------
passport.use(new DwollaStrategy({
    clientID: secrets.dwolla.clientID,
    clientSecret: secrets.dwolla.clientSecret,
    callbackURL: secrets.dwolla.callbackURL,
    scope: secrets.dwolla.scope,
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, done) {
    User.findById(req.user._id, function(err, user) {
      user.dwolla.id = profile.id,
      user.dwolla.token = accessToken,
      user.dwolla.name = profile.displayName
      user.save(function(err) {
        req.flash('info', { msg: 'Dwolla account has been linked.' });
        console.log('go back to hell');
        done(err, user, accessToken);
      });
    });    
  }
));
// =============================================================================
