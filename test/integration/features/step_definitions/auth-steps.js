import oz from 'oz';
import hoek from 'hoek';
import {defineSupportCode} from 'cucumber';
import {World} from '../support/world';
import apps from '../../../../data/auth/apps.json';
import grants from '../../../../data/auth/grants';

function requestAppTicket(appDetails, callback) {
  this.makeOzRequest({endpoint: '/oz/app'}, appDetails, callback);
}

function simulateUserGettingRsvpByGrantingScopes(callback) {
  oz.ticket.rsvp(apps.foo, grants[0], 'reallylongpasswordthatisntverysecureyet', {}, callback);
}

function exchangeRsvpForUserTicket(appTicket, rsvp, callback) {
  this.makeOzRequest({
    endpoint: '/oz/rsvp',
    payload: JSON.stringify({rsvp})
  }, appTicket, callback);
}

function getUserTicket(callback) {
  requestAppTicket.call(this, apps.foo, (err1, appTicket) => {
    hoek.assert(!err1, err1);

    simulateUserGettingRsvpByGrantingScopes.call(this, (err2, rsvp) => {
      hoek.assert(!err2, err2);

      exchangeRsvpForUserTicket.call(this, appTicket, rsvp, (err3, userTicket) => {
        hoek.assert(!err3, err3);

        this.ozUserTicket = userTicket;

        callback();
      });
    });
  });
}

defineSupportCode(({Given, setWorldConstructor}) => {
  setWorldConstructor(World);

  Given(/^request is anonymous$/, function (callback) {
    callback();
  });

  Given(/^request includes oz ticket$/, function (callback) {
    getUserTicket.call(this, callback);
  });
});
