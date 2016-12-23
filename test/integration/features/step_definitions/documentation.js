import referee, {assert} from 'referee';

require('referee-more-assertions')(referee);

module.exports = function () {
  const SUCCESS = 200;

  this.When(/^the documentation is requested in the browser$/, function (callback) {
    this.getRequestTo('/documentation', callback);
  });

  this.Then(/^the documentation should be viewable in the browser$/, function (callback) {
    assert.equals(this.getResponseStatus(), SUCCESS);
    assert.equals(this.getResponseHeaders()['content-type'], 'text/html; charset=utf-8');

    callback();
  });

  this.When(/^the docs are requested$/, function (callback) {
    this.getRequestTo('/swagger', callback);
  });

  this.Then(/^the top-level endpoints should be included$/, function (callback) {
    const paths = JSON.parse(this.getResponseBody()).paths;
    assert.defined(paths['/rides']);
    assert.defined(paths['/persons']);

    callback();
  });

  this.Then(/^the GET by id endpoints should be included$/, function (callback) {
    const paths = JSON.parse(this.getResponseBody()).paths;

    assert.defined(paths['/rides/{id}']);
    assert.defined(paths['/persons/{id}']);

    callback();
  });
};
