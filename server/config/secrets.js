'use strict';

var secrets = module.exports = {

  session: {
    key: 'sessionId',
    secret: 'secretToBeChanged'
  },

  linkedinAuth: true,
  linkedin: {
    clientID: process.env.LINKEDIN_ID || '75msivcjwrvequ',
    clientSecret: process.env.LINKEDIN_SECRET || 'HLR310ufalk4Q4iS',
    callbackURL: '/auth/linkedin/callback',
    scope: ['r_fullprofile', 'r_emailaddress', 'r_network'],
    passReqToCallback: true
  },

  dwolla: {
    clientID: '08oeVrkeX28nbK7onIuqT7OBhOWe1BVlC6Mxb0p7p+aW12MJz7',
    clientSecret: 'bA0ngjK9NW+Mtyxq3USGsV+sYbdGWVPhvdVm0W9hW7ExgYIT7+',
    callbackURL: '/auth/dwolla/callback',
    scope: ['Transactions|Balance|Request|AccountInfoFull|Send'],
    passReqToCallback: true
  },

  nodeMailer: {
    gmail: {
      email: 'ownyourcity.dummy@gmail.com',
      password: 'dummy.ownyourcity'
    }
  }

};