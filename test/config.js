
var Config = require('../lib/config');
var should = require('should');
var path = require('path');

var CONFIG_PATH = path.join(__dirname, 'specimens/config');

describe('config', function() {
  it('throws an Error if the config path is invalid', function() {
    (function() {
      var config = new Config();
    }).should.throw();
  });
});

describe('config.path', function() {
  it('is the config path passed to the constructor', function() {
    var config = new Config(CONFIG_PATH);
    config.path.should.equal(CONFIG_PATH);
  });
});

describe('config.init()', function() {
  it('executes its a callback passing an error on failure', function(done) {
    var config = new Config(CONFIG_PATH);
    config.path = '/dev/null';
    config.init(function(err, config) {
      err.should.be.instanceOf(Error);
      done();
    });
  });
});

describe('config.ready', function() {
  it('is false before loading completes', function() {
    var config = new Config(CONFIG_PATH);
    config.ready.should.be.false;
  });

  it('is true once loading is complete', function(done) {
    var config = new Config(CONFIG_PATH);
    config.init(function(err, config) {
      config.ready.should.be.true;
      done();
    });
  });
});

describe('config[configId]', function() {
  it('exists for each config containing their data', function(done) {
    var config = new Config(CONFIG_PATH);
    config.init(function(err, config) {
      config.foo.should.be.ok;
      config.foo.bar.baz.should.be.ok;
      done();
    });
  });
  it('does not exist for invalid configs', function(done) {
    var config = new Config(CONFIG_PATH);
    config.init(function(err, config) {
      should.not.exist(config.bar);
      should.not.exist(config.baz);
      done();
    });
  });
});
