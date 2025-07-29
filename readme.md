# @mapbox/mock-aws-sdk-js

[![Build Status](https://travis-ci.org/mapbox/mock-aws-sdk-js.svg?branch=master)](https://travis-ci.org/mapbox/mock-aws-sdk-js)

A library that provides sinon-style stubs for AWS SDK for JavaScript (v3) service methods for use in testing.

### Goals

- allow tests to make assertions about both service client configuration (e.g. region) and method arguments
- enable tests for application logic with varied usage of AWS SDK v3 patterns

### Usage

Your application using AWS SDK v3 patterns:

```js
var { S3Client } = require('@aws-sdk/client-s3');
var { GetObjectCommand } = require('@aws-sdk/client-s3');

module.exports = function(callback, clientInstance) {
  var s3Client = clientInstance || new S3Client({ region: 'eu-west-1' });
  var command = new GetObjectCommand({ Bucket: 'bucket', Key: 'key' });

  s3Client.send(command)
    .then(function(data) {
      callback(null, data.Body.toString());
    })
    .catch(function(err) {
      callback(err);
    });
};
```

Your test script using v3 patterns:

```js
var test = require('tape');
var app = require('./app');
var { S3Client, GetObjectCommand } = require('@mapbox/mock-aws-sdk-js');

test('gets S3 object with v3 patterns', function(assert) {
  var data = { Body: Buffer.from('hello world') };
  var expected = { Bucket: 'bucket', Key: 'key' };

  // Create a mock S3 client
  var s3Client = new S3Client({ region: 'eu-west-1' });

  // Stub the send method to return test data
  s3Client.send.resolves(data);

  app(function(err, result) {
    assert.ifError(err, 'success');
    assert.equal(result, 'hello world');

    // Verify the send method was called once
    assert.equal(s3Client.send.callCount, 1, 'client.send called once');

    // Verify the command was correct
    var calledCommand = s3Client.send.getCall(0).args[0];
    assert.ok(calledCommand instanceof GetObjectCommand, 'called with GetObjectCommand');
    assert.deepEqual(calledCommand.input, expected, 'command has expected input');

    assert.end();
  }, s3Client);
});
```


### Available v3 Clients and Commands

The library provides mock implementations for the following AWS SDK v3 clients:

- `S3Client` with commands: `GetObjectCommand`, `PutObjectCommand`, `DeleteObjectCommand`, `ListObjectsV2Command`, `HeadObjectCommand`, `CopyObjectCommand`
- `DynamoDBClient` with commands: `GetItemCommand`, `PutItemCommand`, `DeleteItemCommand`, `ScanCommand`, `QueryCommand`, `UpdateItemCommand`
- `LambdaClient` with commands: `InvokeCommand`, `CreateFunctionCommand`, `DeleteFunctionCommand`, `ListFunctionsCommand`, `UpdateFunctionCodeCommand`
- `SQSClient` with commands: `SendMessageCommand`, `ReceiveMessageCommand`, `DeleteMessageCommand`, `CreateQueueCommand`, `DeleteQueueCommand`
- `SNSClient` with commands: `PublishCommand`, `SubscribeCommand`, `CreateTopicCommand`, `DeleteTopicCommand`, `ListTopicsCommand`
- `SecretsManagerClient` with commands: `GetSecretValueCommand`, `CreateSecretCommand`, `UpdateSecretCommand`, `DeleteSecretCommand`, `ListSecretsCommand`

### Advanced v3 Testing Patterns

```js
var { S3Client, GetObjectCommand } = require('@mapbox/mock-aws-sdk-js');
var sinon = require('sinon');

// Mock different commands with different responses
var s3Client = new S3Client({ region: 'us-east-1' });
s3Client.send.callsFake(function(command) {
  if (command instanceof GetObjectCommand) {
    return Promise.resolve({ Body: Buffer.from('file content') });
  }
  return Promise.reject(new Error('Unknown command'));
});

// Use sinon matchers for flexible command matching
s3Client.send
  .withArgs(sinon.match.instanceOf(GetObjectCommand))
  .resolves({ Body: Buffer.from('matched content') });

// Mock errors
s3Client.send.rejects(new Error('Access Denied'));
```

Read all about [how to use sinon stubs here](http://sinonjs.org/docs/#stubs).

### More examples

`test/test-app-v3.js` demonstrates v3-style usage patterns, and `test/index-v3.test.js` shows how to test them using v3 testing capabilities.
