var events = require('events');
var sinon = require('sinon');
var _AWS = require('aws-sdk');
var traverse = require('traverse');

module.exports = _AWS;
module.exports.stub = stubMethod;

/**
 * Replaces a single AWS service method with a stub.
 *
 * @param {string} service - the name of the AWS service. Can include `.` for
 * nested services, e.g. `'DynamoDB.DocumentClient'`.
 * @param {string} method - the name of the service method to stub.
 * @param {function} [replacement] - if specified, this function will be called
 * when the service method stub is invoked. `this` in the context of the function
 * will provide a reference to stubbed AWS.Request and AWS.Response objects to
 * simulate more advanced aws-sdk-js usage patterns.
 * @returns {object} stub - [a sinon stub](http://sinonjs.org/docs/#stubs).
 */
function stubMethod(service, method, replacement) {
  if (!isStubbed(service)) stubService(service);
  if (!replacement) return sinon.stub(getService(service).prototype, method).returns(stubRequest());

  return sinon.stub(getService(service).prototype, method, function(params, callback) {
    var _this = { request: stubRequest(), response: stubResponse() };
    replacement.call(_this, params, callback);
    return _this.request;
  });
}

function isStubbed(service) {
  return getService(service).isSinonProxy;
}

function getService(name) {
  return traverse(_AWS).get(name.split('.'));
}

function setService(name, fn) {
  traverse(_AWS).set(name.split('.'), fn);
}

function stubService(service) {
  var Original = getService(service);
  var client = new Original();

  function FakeService(config) { Object.assign(this, new Original(config)); }
  FakeService.prototype = Object.assign({}, client.__proto__);

  var spy = sinon.spy(FakeService);
  spy.restore = function() { setService(service, Original); };

  setService(service, spy);
}

function stubRequest() {
  var req = new events.EventEmitter();
  var stubbed = sinon.createStubInstance(_AWS.Request);
  for (var method in req.__proto__) delete stubbed[method];
  return Object.assign(req, stubbed);
}

function stubResponse() {
  var req = new events.EventEmitter();
  var stubbed = sinon.createStubInstance(_AWS.Response);
  for (var method in req.__proto__) delete stubbed[method];
  return Object.assign(req, stubbed);
}
