# @mapbox/mock-aws-sdk-js

A library that provides sinon-style stubs for aws-sdk-js service methods for use in testing.

### Goals

- allow tests to make assertions about both service client configuration (e.g. region) and method arguments
- enable tests for application logic with varied usage of `AWS.Request` object methods

### Basic usage

Your application, `app.js`:

```js
var AWS = require('aws-sdk');

module.exports = function(callback) {
  // It is important that aws-sdk clients be defined in a function, and not
  // as module-level variables.
  var s3 = new AWS.S3({ region: 'eu-west-1' });
  s3.getObject({ Bucket: 'bucket', Key: 'key' }, function(err, data) {
    if (err) return callback(err);
    callback(null, data.Body.toString());
  });
}
```

Your test script:

```js
var test = require('tape');
var app = require('./app');
var AWS = require('@mapbox/mock-aws-sdk-js');

test('gets S3 object', function(assert) {
  var data = { Body: new Buffer('hello world') };
  var expected = { Bucket: 'bucket', Key: 'key' };

  AWS.stub('S3', 'getObject', function(params, callback) {
    assert.deepEqual(params, expected, 'called s3.getObject with expected params');
    callback(null, data);
  });

  app.useCallback(function(err, data) {
    assert.ifError(err, 'success');
    assert.equal(data, 'hello world');

    assert.equal(getObject.callCount, 1, 'called s3.getObject once');
    assert.equal(AWS.S3.callCount, 1, 'one s3 client created');
    assert.ok(AWS.S3.calledWithExactly({ region: 'eu-west-1' }), 's3 client created for the correct region');

    AWS.S3.restore();
    assert.end();
  });
});
```

Read all about [how to use sinon stubs here](http://sinonjs.org/docs/#stubs).

### More examples

`test/test-app.js` represents a module that makes the same basic S3.getObject request in several different ways. `test/index.test.js` then contains a number of examples for how you might choose to write tests for the module.
