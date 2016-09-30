var test = require('tape');
var stream = require('stream');
var events = require('events');

var AWS = require('..');
var app = require('./test-app');

var data = { Body: new Buffer('hello world') };
var expected = { Bucket: 'bucket', Key: 'key' };
var region = 'eu-west-1';

test('[useCallback] sinon-style', function(assert) {
  var getObject = AWS.stub('S3', 'getObject');
  getObject.yields(null, data);

  app.useCallback(function(err, data) {
    assert.ifError(err, 'success');
    assert.equal(data, 'hello world');

    assert.equal(AWS.S3.callCount, 1, 'one s3 client created');
    assert.ok(AWS.S3.calledWithExactly({ region }), 's3 client created for the correct region');

    assert.equal(getObject.callCount, 1, 'called s3.getObject once');
    assert.ok(getObject.calledWith(expected), 'called s3.getObject with expected params');

    AWS.S3.restore();
    assert.end();
  });
});

test('[useCallback] use replacement function', function(assert) {
  var getObject = AWS.stub('S3', 'getObject', function(params, callback) {
    callback(null, data);
  });

  app.useCallback(function(err, data) {
    assert.ifError(err, 'success');
    assert.equal(data, 'hello world');

    assert.equal(AWS.S3.callCount, 1, 'one s3 client created');
    assert.ok(AWS.S3.calledWithExactly({ region }), 's3 client created for the correct region');

    assert.equal(getObject.callCount, 1, 'called s3.getObject once');
    assert.ok(getObject.calledWith(expected), 'called s3.getObject with expected params');

    AWS.S3.restore();
    assert.end();
  });
});

test('[useCallback] assertions inside the replacement function', function(assert) {
  assert.plan(3); // allows you to assert that the replacement function was called

  AWS.stub('S3', 'getObject', function(params, callback) {
    assert.deepEqual(params, expected, 'called s3.getObject with expected params');
    callback(null, data);
  });

  app.useCallback(function(err, data) {
    assert.ifError(err, 'success');
    assert.equal(data, 'hello world');
    AWS.S3.restore();
  });
});

test('[usePromise] sinon-style', function(assert) {
  var getObject = AWS.stub('S3', 'getObject');
  getObject.returns({
    promise: function() { return Promise.resolve(data); }
  });

  app.usePromise(function(err, data) {
    assert.ifError(err, 'success');
    assert.equal(data, 'hello world');

    assert.equal(AWS.S3.callCount, 1, 'one s3 client created');
    assert.ok(AWS.S3.calledWithExactly({ region }), 's3 client created for the correct region');

    assert.equal(getObject.callCount, 1, 'called s3.getObject once');
    assert.ok(getObject.calledWith(expected), 'called s3.getObject with expected params');

    AWS.S3.restore();
    assert.end();
  });
});

test('[usePromise] replacement function', function(assert) {
  var getObject = AWS.stub('S3', 'getObject', function() {
    this.request.promise.returns(Promise.resolve(data));
  });

  app.usePromise(function(err, data) {
    assert.ifError(err, 'success');
    assert.equal(data, 'hello world');

    assert.equal(AWS.S3.callCount, 1, 'one s3 client created');
    assert.ok(AWS.S3.calledWithExactly({ region }), 's3 client created for the correct region');

    assert.equal(getObject.callCount, 1, 'called s3.getObject once');
    assert.ok(getObject.calledWith(expected), 'called s3.getObject with expected params');

    AWS.S3.restore();
    assert.end();
  });
});

test('[streaming] sinon-style', function(assert) {
  var getObject = AWS.stub('S3', 'getObject');
  getObject.returns({
    createReadStream: function() {
      return new stream.Readable({
        read: function() {
          this.push(data.Body);
          this.push(null);
        }
      });
    }
  });

  app.streaming(function(err, data) {
    assert.ifError(err, 'success');
    assert.equal(data, 'hello world');

    assert.equal(AWS.S3.callCount, 1, 'one s3 client created');
    assert.ok(AWS.S3.calledWithExactly({ region }), 's3 client created for the correct region');

    assert.equal(getObject.callCount, 1, 'called s3.getObject once');
    assert.ok(getObject.calledWith(expected), 'called s3.getObject with expected params');

    AWS.S3.restore();
    assert.end();
  });
});

test('[streaming] replacement function', function(assert) {
  var getObject = AWS.stub('S3', 'getObject', function() {
    this.request.createReadStream.returns(new stream.Readable({
      read: function() {
        this.push(data.Body);
        this.push(null);
      }
    }));
  });

  app.streaming(function(err, data) {
    assert.ifError(err, 'success');
    assert.equal(data, 'hello world');

    assert.equal(AWS.S3.callCount, 1, 'one s3 client created');
    assert.ok(AWS.S3.calledWithExactly({ region }), 's3 client created for the correct region');

    assert.equal(getObject.callCount, 1, 'called s3.getObject once');
    assert.ok(getObject.calledWith(expected), 'called s3.getObject with expected params');

    AWS.S3.restore();
    assert.end();
  });
});

test('[useEvents] sinon-style', function(assert) {
  var getObject = AWS.stub('S3', 'getObject');
  var req = new events.EventEmitter();
  req.send = function() { req.emit('success', { data }); };
  getObject.returns(req);

  app.useEvents(function(err, data) {
    assert.ifError(err, 'success');
    assert.equal(data, 'hello world');

    assert.equal(AWS.S3.callCount, 1, 'one s3 client created');
    assert.ok(AWS.S3.calledWithExactly({ region }), 's3 client created for the correct region');

    assert.equal(getObject.callCount, 1, 'called s3.getObject once');
    assert.ok(getObject.calledWith(expected), 'called s3.getObject with expected params');

    AWS.S3.restore();
    assert.end();
  });
});

test('[useEvents] replacement function', function(assert) {
  var send;
  var getObject = AWS.stub('S3', 'getObject', function() {
    send = this.request.send;
    this.response.data = data;
    setImmediate(() => { this.request.emit('success', this.response); });
  });

  app.useEvents(function(err, data) {
    assert.ifError(err, 'success');
    assert.equal(data, 'hello world');

    assert.equal(AWS.S3.callCount, 1, 'one s3 client created');
    assert.ok(AWS.S3.calledWithExactly({ region }), 's3 client created for the correct region');

    assert.equal(getObject.callCount, 1, 'called s3.getObject once');
    assert.ok(getObject.calledWith(expected), 'called s3.getObject with expected params');

    assert.equal(send.callCount, 1, 'called request.send once');

    AWS.S3.restore();
    assert.end();
  });
});

test('[multipleMethods] replacement function', function(assert) {
  var body;

  var putObject = AWS.stub('S3', 'putObject', function(params) {
    body = params.Body;
    this.request.promise.returns(Promise.resolve());
  });

  var getObject = AWS.stub('S3', 'getObject', function() {
    var data = { Body: body };
    this.request.promise.returns(Promise.resolve(data));
  });

  app.multipleMethods(function(err, data) {
    assert.ifError(err, 'success');
    assert.equal(data, 'hello world');

    assert.equal(AWS.S3.callCount, 1, 'one s3 client created');
    assert.ok(AWS.S3.calledWithExactly({ region }), 's3 client created for the correct region');

    assert.equal(putObject.callCount, 1, 'one s3.putObject request was made');
    assert.ok(putObject.calledWith(Object.assign({ Body: body }, expected)), 'called s3.putObject with expected params');

    assert.equal(getObject.callCount, 1, 'called s3.getObject once');
    assert.ok(getObject.calledWith(expected), 'called s3.getObject with expected params');

    AWS.S3.restore();
    assert.end();
  });
});

test('[upload] methods inherited multiple times', function(assert) {
  var upload = AWS.stub('S3', 'upload', function(params, callback) {
    callback(null, data);
  });

  app.upload(function(err, data) {
    assert.ifError(err, 'success');
    assert.equal(data, 'hello world');

    assert.equal(AWS.S3.callCount, 1, 'one s3 client created');
    assert.ok(AWS.S3.calledWithExactly({ region }), 's3 client created for the correct region');

    assert.equal(upload.callCount, 1, 'called s3.upload once');
    assert.ok(upload.calledWith(expected), 'called s3.upload with expected params');

    AWS.S3.restore();
    assert.end();
  });
});
