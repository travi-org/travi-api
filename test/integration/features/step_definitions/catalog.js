'use strict';

var loadApi = require('../../../../index.js'),
    referee = require('referee'),
    assert = referee.assert;
referee.format = require('formatio').configure({quoteStrings: false}).ascii;

module.exports = function () {
    this.World = require('../support/world.js').World;

    this.Given(/^the api contains no resources$/, function (callback) {
        callback();
    });

    this.When(/^the catalog is requested$/, function (callback) {
        var world = this;

        loadApi.then(function (server) {
            server.inject({
                method: 'GET',
                url: '/'
            }, function (response) {
                world.apiResponse = response;

                callback();
            });
        });
    });

    this.Then(/^the catalog should include top level links$/, function (callback) {
        loadApi.then(function (server) {
            var baseUrl = 'https://' + server.info.host + ':' + server.info.port;

            assert.equals(this.apiResponse.statusCode, 200);
            assert.equals(
                JSON.parse(this.apiResponse.payload)._links,
                {
                    self: { href: baseUrl + '/' },
                    rides: { href: baseUrl + '/rides' },
                    users: { href: baseUrl + '/users' }
                }
            );

            callback();
        });
    });
};
