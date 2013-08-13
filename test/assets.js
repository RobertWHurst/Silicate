
var Assets = require('../lib/assets');
var should = require('should');
var path = require('path');
var connect = require('connect');
var request = require('supertest');
var http = require('http');
var fs = require('fs');

var ASSETS_PATH = path.join(__dirname, 'specimens/assets');

describe('assets', function() {
  it('inherits from EventEmitter', function(done) {
    var assets = new Assets(ASSETS_PATH);
    assets.on('foo', function() { done(); });
    assets.emit('foo');
  });
  it('throws an Error if the assets path is invalid', function() {
    (function() {
      var assets = new Assets();
    }).should.throw();
  });
  it('emits a \'file\' event when a valid file is requested', function(done) {
    var assets = new Assets(ASSETS_PATH);
    var app = connect();
    app.use(assets.middleware());
    assets.on('file', function(req, res) {
      req.should.be.an.instanceOf(http.IncomingMessage);
      req.file.should.be.ok;
      req.file.path.should.equal(path.join(ASSETS_PATH, 'index.html'));
      req.file.stat.should.be.an.instanceOf(fs.Stats);
      res.should.be.an.instanceOf(http.ServerResponse);
    });
    request(app, app.url).get('/').end(done);
  });
  it('emits a \'directory\' event when a valid directory is requested', function(done) {
    var assets = new Assets(ASSETS_PATH);
    var app = connect();
    app.use(assets.middleware());
    assets.on('directory', function(req, res) {
      req.should.be.an.instanceOf(http.IncomingMessage);
      res.should.be.an.instanceOf(http.ServerResponse);
    });
    request(app, app.url).get('/').end(done);
  });
  it('emits a \'error\' event when a request fails', function(done) {
    var assets = new Assets(ASSETS_PATH);
    var app = connect();
    app.use(assets.middleware());
    assets.on('error', function(err, req, res) {
      err.should.be.an.instanceOf(Error);
      err.status.should.be.ok;
      req.should.be.an.instanceOf(http.IncomingMessage);
      res.should.be.an.instanceOf(http.ServerResponse);
      res.status == 200;
      res.end();
    });
    request(app, app.url).get('/foo/bar').end(done);
  });
});
describe('assets.middleware()', function() {
  it('is connect middleware that serves static files from the assets path', function(done) {
    var assets = new Assets(ASSETS_PATH);
    var app = connect();
    app.use(assets.middleware());
    request(app)
      .get('/')
      .expect(200)
      .expect('Content-Type', /html/)
      .end(function(err, res) {
        if(err) { throw err; }
        res.text.should.equal('<h1>hello!</h1>');
        done();
      });
  });
});
