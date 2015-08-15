'use strict';

var path = require('path'),
    fs = require('fs'),
    repo = require(path.join(__dirname, '../../../lib/users/repository'));

require('setup-referee-sinon/globals');

suite('user repository', function () {
    setup(function () {
        sinon.stub(fs, 'readFile');
    });

    teardown(function () {
        fs.readFile.restore();
    });

    test('that data is loaded from a file', function () {
        var callback = sinon.spy(),
            data = {};
        fs.readFile.withArgs(path.join(__dirname, '../../../data/users.json'), 'utf8').yields(null, data);

        repo.getList(callback);

        assert.calledWith(callback, null, data);
    });
});