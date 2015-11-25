'use strict';

var loadApi = require('../../../../index.js'),
    fs = require('fs'),
    path = require('path'),
    queryString = require('query-string'),
    _ = require('lodash'),
    any = require(path.join(__dirname, '../../../helpers/any-for-api'));
require('setup-referee-sinon/globals');

module.exports = function () {
    this.World = require('../support/world.js').World;

    var resourceLists = {},
        resourceComparators = {
            rides: function (actualItem, expectedItem) {
                var selfLink = actualItem._links.self.href,
                    path = '/rides/' + expectedItem.id;

                refute.equals(-1, selfLink.indexOf(path, selfLink.length - path.length));
                assert.equals(actualItem.id, expectedItem.id);
                assert.equals(actualItem.nickname, expectedItem.nickname);
            },
            users: function (actualItem, expectedItem) {
                var selfLink = actualItem._links.self.href,
                    path = '/users/' + expectedItem.id;

                refute.equals(-1, selfLink.indexOf(path, selfLink.length - path.length));
                assert.equals(actualItem.id, expectedItem.id);
                assert.equals(actualItem['first-name'], expectedItem['first-name']);
                assert.equals(actualItem['last-name'], expectedItem['last-name']);
            }
        };

    function makeSingular(resourceType) {
        return resourceType.substring(0, resourceType.length - 1);
    }

    function defineListForType(resourceType, resourceList) {
        resourceLists[resourceType] = resourceList;

        sinon.stub(fs, 'readFile')
            .withArgs(sinon.match(
                function (value) {
                    return value.indexOf('data/' + resourceType + '.json') > -1;
                },
                'utf8'
            ))
            .callsArgWithAsync(2, null, JSON.stringify(resourceList));
    }

    function getListForType(resourceType) {
        return resourceLists[resourceType];
    }

    function assertPropertyIsPopulatedInResource(type, property) {
        assert.defined(type[property]);
    }

    function assertPropertyIsNotPopulatedInResource(type, property) {
        refute.defined(type[property]);
    }

    function assertPropertyIn(property, response, resourceType, check) {
        if (response._embedded && _.isArray(response._embedded[resourceType])) {
            _.each(response._embedded[resourceType], function (item) {
                check(item, property);
            });
        } else {
            check(response, property);
        }
    }

    function assertThumbnailSizedAt(property, size, response, resourceType) {
        var check = function (item, property) {
            var thumbnail = item[property];

            assert.equals(
                queryString.parse(queryString.extract(thumbnail.src)).size,
                size
            );
            assert.equals(thumbnail.size, parseInt(size, 10));
        };

        if (response._embedded && _.isArray(response._embedded[resourceType])) {
            _.each(response._embedded[resourceType], function (item) {
                check(item, property);
            });
        } else {
            check(response, property);
        }
    }

    this.After(function (callback) {
        if (fs.readFile.restore) {
            fs.readFile.restore();
        }

        callback();
    });

    this.Given(/^the list of "([^"]*)" is empty$/, function (resourceType, callback) {
        defineListForType(resourceType, []);

        callback();
    });

    this.Given(/^the list of "([^"]*)" is not empty$/, function (resourceType, callback) {
        defineListForType(resourceType, any.listOf(any.resources[makeSingular(resourceType)], {min: 1}));

        callback();
    });

    this.Given(/^request is anonymous$/, function (callback) {
        callback();
    });

    this.Given(/^request is authenticated$/, function (callback) {
        callback();
    });

    this.Given(/^user "([^"]*)" exists$/, function (user, callback) {
        callback();
    });

    this.Given(/^ride "([^"]*)" exists$/, function (ride, callback) {
        callback();
    });

    this.Given(/^user "([^"]*)" does not exist$/, function (user, callback) {
        callback();
    });

    this.Given(/^ride "([^"]*)" does not exist$/, function (ride, callback) {
        callback();
    });

    this.When(/^ride "([^"]*)" is requested by id$/, function (ride, callback) {
        var world = this;

        fs.readFile(path.join(__dirname, '../../../../data/rides.json'), 'utf8', function (err, content) {
            var match = _.find(JSON.parse(content), _.matchesProperty('nickname', ride)),
                id = !_.isEmpty(match) ? _.result(match, 'id') : ride;

            loadApi.then(function (server) {
                server.inject({
                    method: 'GET',
                    url: '/rides/' + id
                }, function (response) {
                    world.apiResponse = response;
                    callback();
                });
            });
        });
    });

    this.When(/^user "([^"]*)" is requested by id$/, function (user, callback) {
        var world = this;

        fs.readFile(path.join(__dirname, '../../../../data/users.json'), 'utf8', function (err, content) {
            var match = _.find(JSON.parse(content), _.matchesProperty('first-name', user)),
                id = !_.isEmpty(match) ? _.result(match, 'id') : user;

            loadApi.then(function (server) {
                server.inject({
                    method: 'GET',
                    url: '/users/' + id
                }, function (response) {
                    world.apiResponse = response;
                    callback();
                });
            });
        });
    });

    this.When(/^"([^"]*)" is requested$/, function (path, callback) {
        var world = this;

        loadApi.then(function (server) {
            server.inject({
                method: 'GET',
                url: path
            }, function (response) {
                world.apiResponse = response;
                callback();
            });
        });
    });

    this.Then(/^a list of "([^"]*)" is returned$/, function (resourceType, callback) {
        var actualList = JSON.parse(this.apiResponse.payload)._embedded[resourceType],
            expectedList = getListForType(resourceType);

        assert.equals(this.apiResponse.statusCode, 200);
        assert.equals(actualList.length, expectedList.length);
        _.forEach(actualList, function (actualItem, index) {
            var expectedItem = expectedList[index];
            resourceComparators[resourceType](actualItem, expectedItem);
        });

        callback();
    });

    this.Then(/^an empty list is returned$/, function (callback) {
        assert.equals(this.apiResponse.statusCode, 200);
        refute.defined(JSON.parse(this.apiResponse.payload)._embedded);

        callback();
    });

    this.Then(/^"([^"]*)" is not included in "([^"]*)"$/, function (property, resourceType, callback) {
        assertPropertyIn(
            property,
            JSON.parse(this.apiResponse.payload),
            resourceType,
            assertPropertyIsNotPopulatedInResource
        );

        callback();
    });

    this.Then(/^"([^"]*)" is populated in "([^"]*)"$/, function (property, resourceType, callback) {
        assertPropertyIn(
            property,
            JSON.parse(this.apiResponse.payload),
            resourceType,
            assertPropertyIsPopulatedInResource
        );

        callback();
    });

    this.Then(/^user "([^"]*)" is returned$/, function (user, callback) {
        assert.equals(this.apiResponse.statusCode, 200);
        assert.equals(JSON.parse(this.apiResponse.payload)['first-name'], user);

        callback();
    });

    this.Then(/^ride "([^"]*)" is returned$/, function (ride, callback) {
        assert.equals(this.apiResponse.statusCode, 200);
        assert.equals(JSON.parse(this.apiResponse.payload).nickname, ride);

        callback();
    });

    this.Then(/^the response will be "([^"]*)"$/, function (status, callback) {
        var statuses = {
            'Not Found': 404
        };

        assert.equals(this.apiResponse.statusCode, statuses[status]);

        callback();
    });

    this.Then(/^list of "([^"]*)" has self links populated$/, function (resourceType, callback) {
        var response = JSON.parse(this.apiResponse.payload),
            items = response._embedded[resourceType];

        assert.defined(response._links.self);
        assert.greater(items.length, 0);
        _.forEach(items, function (item) {
            assert.defined(item._links.self);
        });

        callback();
    });

    this.Then(/^the "([^"]*)" is sized at "([^"]*)"px in "([^"]*)"$/, function (
        property,
        size,
        resourceType,
        callback
    ) {
        assertThumbnailSizedAt(property, size, JSON.parse(this.apiResponse.payload), resourceType);

        callback();
    });
};