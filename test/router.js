
var Router = require('../lib/router');
var util = require('util');

var METHODS = ['get', 'post', 'put', 'patch', 'delete'];

describe('router', function() {
  it('should inherit from EventEmitter', function(done) {
    var router = new Router(function() {});
    router.on('foo', done);
    router.emit('foo');
  });
});

describe('router.match', function() {
  it('binds a path, to a controller, and action', function() {
    var router = new Router(function() {});
    router.match('/', { controller: 'pages', action: 'index' });
    for(var i = 0; i < METHODS.length; i += 1) {
      router.routes.anchored['/'][METHODS[i]][0].controller.should.equal('pages');
      router.routes.anchored['/'][METHODS[i]][0].action.should.equal('index');
    }
  });
  it('binds a path, to a controller, and action expression', function() {
    var router = new Router(function() {});
    router.match('/', 'pages#index');
    for(var i = 0; i < METHODS.length; i += 1) {
      router.routes.anchored['/'][METHODS[i]][0].controller.should.equal('pages');
      router.routes.anchored['/'][METHODS[i]][0].action.should.equal('index');
    }
  });
  it('binds a path, to a module, controller, and action', function() {
    var router = new Router(function() {});
    router.match('/', {
      module: 'main',
      controller: 'pages',
      action: 'index'
    });
    for(var i = 0; i < METHODS.length; i += 1) {
      router.routes.anchored['/'][METHODS[i]][0].module.should.equal('main');
      router.routes.anchored['/'][METHODS[i]][0].controller.should.equal('pages');
      router.routes.anchored['/'][METHODS[i]][0].action.should.equal('index');
    }
  });
  it('binds a path, to a module, controller, and action expression', function() {
    var router = new Router(function() {});
    router.match('/', 'main:pages#index');
    for(var i = 0; i < METHODS.length; i += 1) {
      router.routes.anchored['/'][METHODS[i]][0].module.should.equal('main');
      router.routes.anchored['/'][METHODS[i]][0].controller.should.equal('pages');
      router.routes.anchored['/'][METHODS[i]][0].action.should.equal('index');
    }
  });
  it('binds a path to a redirect', function() {
    var router = new Router(function() {});
    router.match('/', '/blog');
    for(var i = 0; i < METHODS.length; i += 1) {
      router.routes.anchored['/'][METHODS[i]][0].to.should.equal('/blog');
    }
  });
});

describe('router.resources', function() {

  it('binds a full set of resource related urls', function(done) {
    var router = new Router(function() {});
    router.resources('posts');
    console.log(router.routes.anchored);
    for(var i = 0; i < METHODS.length; i += 1) {
      router.routes.anchored['/posts'][METHODS[i]][0].controller.should.equal('posts');
      router.routes.anchored['/posts'][METHODS[i]][0].action.should.equal('show');
    }
  });

});

