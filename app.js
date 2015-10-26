'use strict';

// =============================================================================
// Module Dependencies ---------------------------------------------------------
// -----------------------------------------------------------------------------
var express = require('express');
var expressFlash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var bytes = require('bytes');
var helmet = require('helmet');
// =============================================================================

// =============================================================================
// App Modules -----------------------------------------------------------------
// -----------------------------------------------------------------------------
var mvc = {};
mvc.config = require('./server/config')(__dirname);
mvc.models = require('./server/models');
mvc.utils = require('./server/utils');
mvc.controllers = require('./server/controllers');
mvc.routes = require('./server/routes');
// =============================================================================

// =============================================================================
// Connect to mongodb
// -----------------------------------------------------------------------------

mongoose = mvc.utils.mongo.connect(mongoose, mvc.config.db.dev.main, function(err){
  if(err) {
    console.log("Connection to mongo failed.");
    throw err;
  }
});
// Heroku
/*
var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/mydb';

mongoose = mongoose.connect(mongoUri, function(err){
  if(err) {
    console.log("Connection to mongo failed.");
    throw err;
  }
});
*/
// =============================================================================

var app = express();

app.set('port', process.env.PORT || mvc.config.server.port);
app.set('env', process.env.env || mvc.config.server.env);

// =============================================================================
// Log Format to include timestamp in 'dev' format of express.logger
// -----------------------------------------------------------------------------
var logVal = function(tokens, req, res){
  var status = res.statusCode
    , len = parseInt(res.getHeader('Content-Length'), 10)
    , color = 32;

  if (status >= 500) color = 31
  else if (status >= 400) color = 33
  else if (status >= 300) color = 36;

  len = isNaN(len)
    ? ''
    : len = ' - ' + bytes(len);

  var cTime = new Date;

  return '\x1b[90m' + cTime + ' :: ' + req.method
    + ' ' + req.originalUrl + ' '
    + '\x1b[' + color + 'm' + res.statusCode
    + ' \x1b[90m'
    + (cTime - req._startTime)
    + 'ms' + len
    + '\x1b[0m';
};
// -----------------------------------------------------------------------------
app.use(express.logger(logVal));
// =============================================================================

app.set('views', path.join(__dirname, 'server', 'views'));
app.set('view engine', 'jade');

app.use(express.favicon());

app.use(express.bodyParser());
app.use(express.json());

app.use(express.urlencoded());
app.use(expressValidator());
app.use(express.methodOverride());

// =============================================================================
// Helmet ----------------------------------------------------------------------
// -----------------------------------------------------------------------------
var cspPolicy = {
  defaultPolicy: {
    'default-src': ["'self'"],
    'style-src': ["'unsafe-inline' 'self'"],
    'script-src': ['http://maps.googleapis.com/', 'http://maps.gstatic.com',
    "'unsafe-eval' 'unsafe-inline' 'self'"],
    'img-src': ["'self' data:", 'http://m.c.lnkd.licdn.com/', 'http://*.gstatic.com/', 'http://*.googleapis.com/', 'http://mt0.googleapis.com']  // the day we use the cdn
    // 'report-uri': 'oursite/cspreport' // atleast log the violations
  }
};
helmet.csp.policy(cspPolicy);
app.use(helmet.csp());
app.use(helmet.xframe('sameorigin'));
app.use(helmet.iexss());
app.use(helmet.contentTypeOptions());
// =============================================================================

// kill the good for nothing spy
app.disable('x-powered-by');

// =============================================================================
// Session etc -----------------------------------------------------------------
// -----------------------------------------------------------------------------
app.use(express.cookieParser());
app.use(express.cookieSession(mvc.config.secrets.session));
// -----------------------------------------------------------------------------
// Mongo Store for sessions ----------------------------------------------------
// -----------------------------------------------------------------------------
/**
 * We want RESTified app.. so no server side sessions
 *
config.secrets.session.store = new MongoStore({
  url: config.db.dev,
  auto_reconnect: true
});
app.use(express.session(config.secrets.session));
*/
// =============================================================================

var csrfValue = function(req) {
  var token = (req.body && req.body._csrf)
    || (req.query && req.query._csrf)
    || (req.headers['x-csrf-token'])
    || (req.headers['x-xsrf-token']);
  return token;
};
app.use(express.csrf(csrfValue));

app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
  res.locals.user = req.user;
  res.locals.csrfToken = req.csrfToken();
  res.locals.secrets = mvc.config.secrets; // Not sure if this is good...
  next();
});
// =============================================================================

app.use(expressFlash());

var hour = 3600000;
var day = (hour * 24);
var month = (day * 30);

// public assets
app.use('/public',
  express.static(path.join(__dirname, 'server', 'public'), { maxAge: month })
);
app.use('/upload',
  express.static(path.join(__dirname, 'upload'), { maxAge: month })
);

// Keep track of previous URL
app.use(function(req, res, next) {
  if (req.method !== 'GET') return next();
  var path = req.path.split('/')[1];
  if (/(auth|login|logout|signup)$/.test(path)) return next();
  req.session.returnTo = req.path;
  next();
});

// place the router
app.use(app.router);

// Server the error page
/*
app.use(function(req, res) {
  res.status(404);
  res.render('404');
});
*/

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//==============================================================================
// Initialize the routes in app ------------------------------------------------
// -----------------------------------------------------------------------------
mvc.routes.loadRoutes(app, mvc.utils, mvc.controllers, passport);
// =============================================================================

/**
 * Start Express server.
 */
app.listen(app.get('port'), function() {
  console.log("✔ Express server listening on port %d in %s mode", app.get('port'), app.settings.env);
});

module.exports = app;