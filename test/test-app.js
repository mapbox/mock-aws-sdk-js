var AWS = require('aws-sdk');

module.exports = { useCallback, usePromise, streaming, useEvents, multipleMethods };

function useCallback(callback) {
  var s3 = new AWS.S3({ region: 'eu-west-1' });
  s3.getObject({ Bucket: 'bucket', Key: 'key' }, function(err, data) {
    if (err) return callback(err);
    callback(null, data.Body.toString());
  });
}

function usePromise(callback) {
  var s3 = new AWS.S3({ region: 'eu-west-1' });
  s3.getObject({ Bucket: 'bucket', Key: 'key' }).promise()
    .then(function(data) { callback(null, data.Body.toString()); })
    .catch(function(err) { callback(err); });
}

function streaming(callback) {
  var s3 = new AWS.S3({ region: 'eu-west-1' });
  var req = s3.getObject({ Bucket: 'bucket', Key: 'key' });
  var data = '';
  req.createReadStream()
    .on('error', callback)
    .on('data', function(d) { data += d; })
    .on('end', function() { callback(null, data); });
}

function useEvents(callback) {
  var s3 = new AWS.S3({ region: 'eu-west-1' });
  var req = s3.getObject({ Bucket: 'bucket', Key: 'key' });
  req.on('error', callback);
  req.on('success', function(res) {
    callback(null, res.data.Body.toString());
  });
  req.send();
}

function multipleMethods(callback) {
  var s3 = new AWS.S3({ region: 'eu-west-1' });
  var put = s3.putObject({ Bucket: 'bucket', Key: 'key', Body: new Buffer('hello world') }).promise();
  var get = s3.getObject({ Bucket: 'bucket', Key: 'key' }).promise();

  put
    .then(function() { return get; })
    .then(function(data) { callback(null, data.Body.toString()); })
    .catch(callback);
}
