'use strict';

module.exports = {

  loadRoutes: function(app, utils, controllers, passport) {

    var isAuthenticated = utils.passport.isAuthenticated;
    var isAuthorized = utils.passport.isAuthorized;

    app.get('/', function(req, res) {
      if(req.user) { res.redirect('/dashboard') }
      else { res.render('index'); }
    });

    app.get('/dashboard', isAuthenticated, controllers.dashboard.index);

    // =========================================================================
    // Auth Routes -------------------------------------------------------------
    // -------------------------------------------------------------------------
    app.get('/login', controllers.user.getLogin);
    app.post('/login', controllers.user.postLogin);

    app.get('/logout', controllers.user.getLogout);

    app.get('/register', controllers.user.getRegister);
    app.post('/register', controllers.user.postRegister);

    app.get('/forgot', controllers.user.getForgot);
    app.post('/forgot', controllers.user.postForgot);

    app.get('/reset/:token', controllers.user.getReset);
    app.post('/reset/:token', controllers.user.postReset);
    // =========================================================================

    // =========================================================================
    // User Routes -------------------------------------------------------------
    // -------------------------------------------------------------------------
    app.get('/dashboard/profile/edit', isAuthenticated, controllers.user.getProfileEdit);
    app.post('/profile/edit', isAuthenticated, controllers.user.postProfileEdit);
    app.get('/home', isAuthenticated, controllers.user.getHome);
    // =========================================================================

    // =========================================================================
    // Dwolla Routes------------------------------------------------------------
    // -------------------------------------------------------------------------
    app.get('/redirecttodwolla', isAuthenticated, controllers.house.redirectToDwolla);
    app.get('/auth/dwolla', passport.authenticate('dwolla', { state: 'SOME STATE' }));

    app.get('/auth/dwolla/callback', passport.authenticate('dwolla', {
     failureRedirect: '/dashboard' 
    }), function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/continuePurchase');
    });

    // =========================================================================
    // Admin Routes -------------------------------------------------------------
    // -------------------------------------------------------------------------
    app.get('/adminlogin', controllers.admin.getLogin);
    app.post('/adminlogin', controllers.admin.postLogin);
    app.get('/addhouse', isAuthenticated, controllers.house.getAddHouse);
    app.post('/addhouse', isAuthenticated, controllers.house.postAddHouse);
    app.get('/house/:city/:page', isAuthenticated, controllers.house.getAllHouseUser);
    app.get('/adminhouse/:city/:page', isAuthenticated, controllers.house.getAllHouseAdmin);
    app.get('/gethouse/:id', isAuthenticated, controllers.house.getHouse);
    app.get('/disable/:id', isAuthenticated, controllers.house.disableHouse);
    app.get('/enable/:id', isAuthenticated, controllers.house.enableHouse);
    app.post('/house/purchase/:id', isAuthenticated, controllers.house.postBuyHouse);
    app.post('/house/editbiddate/:id', isAuthenticated, controllers.house.editBidDate);
    app.get('/continuePurchase', isAuthenticated, controllers.house.continuePurchase);
    app.get('/user/list', isAuthenticated, controllers.admin.getUserList);
    app.get('/activity/summary', isAuthenticated, controllers.admin.getActivitySummary);
    app.get('/disableUser/:id', isAuthenticated, controllers.admin.getDisableUser);
    app.get('/enableUser/:id', isAuthenticated, controllers.admin.getEnableUser);
    app.get('/verifybid/:bidid/:hid', isAuthenticated, controllers.bid.verifyBid)
    // =========================================================================

    // =========================================================================
    // Linkedin -------------------------------------------------------------
    // -------------------------------------------------------------------------
    app.get('/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));

    app.get('/auth/linkedin/callback', passport.authenticate('linkedin', {
      failureRedirect: '/login'
    }), function(req, res) {
      res.redirect('/dashboard');
    });
    // =========================================================================   

  }

};