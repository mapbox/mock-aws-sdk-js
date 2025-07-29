var sinon = require('sinon');

// Import AWS SDK v3 clients
var { S3Client } = require('@aws-sdk/client-s3');
var { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
var { LambdaClient } = require('@aws-sdk/client-lambda');
var { SQSClient } = require('@aws-sdk/client-sqs');
var { SNSClient } = require('@aws-sdk/client-sns');
var { SecretsManagerClient } = require('@aws-sdk/client-secrets-manager');

var mockClients = {
  S3Client: createMockClient(S3Client),
  DynamoDBClient: createMockClient(DynamoDBClient),
  LambdaClient: createMockClient(LambdaClient),
  SQSClient: createMockClient(SQSClient),
  SNSClient: createMockClient(SNSClient),
  SecretsManagerClient: createMockClient(SecretsManagerClient)
};

// Create mock commands
var mockCommands = createMockCommands();

var exports = {
  // Export mock clients - these will replace the real clients when imported
  S3Client: mockClients.S3Client,
  DynamoDBClient: mockClients.DynamoDBClient,
  LambdaClient: mockClients.LambdaClient,
  SQSClient: mockClients.SQSClient,
  SNSClient: mockClients.SNSClient,
  SecretsManagerClient: mockClients.SecretsManagerClient,

  // Utility functions
  mockClient: mockClient,
  mockCommand: mockCommand,
  restore: restore
};

// Add mock commands to exports
Object.assign(exports, mockCommands);

module.exports = exports;



/**
 * Creates a mock client that follows AWS SDK v3 patterns
 */
function createMockClient(ClientClass) {
  function MockClient(config) {
    this.config = config || {};
    this.middlewareStack = {
      add: sinon.stub(),
      remove: sinon.stub(),
      removeByTag: sinon.stub()
    };

    this.send = sinon.stub().resolves({});
  }

  // Copy static properties from the original client
  Object.setPrototypeOf(MockClient, ClientClass);
  MockClient.prototype = Object.create(ClientClass.prototype);
  MockClient.prototype.constructor = MockClient;

  return MockClient;
}

/**
 * Creates mock commands for AWS SDK v3
 */
function createMockCommands() {
  var commands = {};

  var s3Commands = [
    'GetObjectCommand', 'PutObjectCommand', 'DeleteObjectCommand',
    'ListObjectsV2Command', 'HeadObjectCommand', 'CopyObjectCommand'
  ];

  var dynamoCommands = [
    'GetItemCommand', 'PutItemCommand', 'DeleteItemCommand',
    'ScanCommand', 'QueryCommand', 'UpdateItemCommand'
  ];

  var lambdaCommands = [
    'InvokeCommand', 'CreateFunctionCommand', 'DeleteFunctionCommand',
    'ListFunctionsCommand', 'UpdateFunctionCodeCommand'
  ];

  var sqsCommands = [
    'SendMessageCommand', 'ReceiveMessageCommand', 'DeleteMessageCommand',
    'CreateQueueCommand', 'DeleteQueueCommand'
  ];

  var snsCommands = [
    'PublishCommand', 'SubscribeCommand', 'CreateTopicCommand',
    'DeleteTopicCommand', 'ListTopicsCommand'
  ];

  var secretsManagerCommands = [
    'GetSecretValueCommand', 'CreateSecretCommand', 'UpdateSecretCommand',
    'DeleteSecretCommand', 'ListSecretsCommand'
  ];

  var allCommands = [].concat(s3Commands, dynamoCommands, lambdaCommands, sqsCommands, snsCommands, secretsManagerCommands);

  allCommands.forEach(function(commandName) {
    commands[commandName] = createMockCommand(commandName);
  });

  return commands;
}

/**
 * Creates a mock command constructor
 */
function createMockCommand(commandName) {
  function MockCommand(input) {
    this.input = input || {};
    this.middlewareStack = {
      add: sinon.stub(),
      remove: sinon.stub(),
      removeByTag: sinon.stub()
    };
  }

  MockCommand.prototype.resolveMiddleware = sinon.stub();
  MockCommand.commandName = commandName;

  return MockCommand;
}

/**
 * Utility function to mock a specific client
 */
function mockClient(ClientClass, mockImplementation) {
  var clientName = ClientClass.name;
  var mockClientClass = mockClients[clientName];

  if (!mockClientClass) {
    throw new Error('Unsupported client: ' + clientName);
  }

  if (mockImplementation) {
    // Replace the send method with custom implementation
    mockClientClass.prototype.send = sinon.stub().callsFake(mockImplementation);
  }

  return mockClientClass;
}

/**
 * Utility function to mock a specific command
 */
function mockCommand(CommandClass, mockInput) {
  var commandName = CommandClass.name;
  var mockCommandClass = mockCommands[commandName];

  if (!mockCommandClass) {
    throw new Error('Unsupported command: ' + commandName);
  }

  if (mockInput) {
    // Create a spy that returns the mock input
    return sinon.stub().returns(new mockCommandClass(mockInput));
  }

  return mockCommandClass;
}

/**
 * Restore all mocks
 */
function restore() {
  // Restore all client mocks
  Object.keys(mockClients).forEach(function(clientName) {
    var client = mockClients[clientName];
    if (client.prototype.send && client.prototype.send.restore) {
      client.prototype.send.restore();
    }
  });
}
