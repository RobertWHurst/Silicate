
var path = require('path');
var util = require('util');
var EventEmitter = require('events').EventEmitter;


function Router(routesPath) {
  this.routes = {
    anchored: {},
    unAnchored: {}
  };
  if(typeof routesPath == 'string') {
    require(routesPath)(this);
  } else if(typeof routesPath == 'function') {
    routesPath(this);
  } else {
    throw new Error('invalid routesPath');
  }
}
util.inherits(Router, EventEmitter);

Router.prototype.middleware = function() {
  return function(res, req, next) {
    res.url;
  };
};

Router.prototype.match = function(path, opts) {
  if(typeof opts == 'string') { opts = { to: opts }; }
  
  // expand opts.to m:c#a or c#a expressions
  if(opts.to && opts.to.match('#')) {

    // extract the module name if it exists
    if(opts.to.match(':')) {
      opts.to = opts.to.split(':');
      opts.module = opts.to[0];
      opts.to = opts.to[1];
    }

    // extract the controller and action
    opts.to = opts.to.split('#');
    opts.controller = opts.to[0];
    opts.action = opts.to[1];
    delete opts.to;
  }

  // if the method is given as a string, wrap it
  // in an array
  if(typeof opts.as == 'string') { opts.as = [opts.as]; }

  // if opts.anchor is not set to false explicitly
  // then it defualts to true
  if(opts.anchor !== false) { opts.anchor = true; }
  opts.as = opts.as || ['get', 'post', 'put', 'patch', 'delete'];

  if(opts.to) {
    var route = {
      path: path,
      methods: opts.as,
      to: opts.to
    };
  } else {
    var route = {
      path: path,
      methods: opts.as,
      module: opts.module,
      controller: opts.controller,
      action: opts.action
    };
  }

  // grab the correct routes index; anchored vs
  // unAnchored routes
  var routes;
  if(opts.anchor) { routes = this.routes.anchored; }
  else { routes = this.routes.unAnchored; }

  // bind the route to the path and method(s)
  for(var i = 0; i < opts.as.length; i += 1) {
    if(!routes[path]) { routes[path] = {}; }
    if(!routes[path][opts.as[i]]) { routes[path][opts.as[i]] = []; }
    routes[path][opts.as[i]].push(route);
  }
};

for(var method in ['get', 'post', 'put', 'patch', 'delete']) {
  Router.prototype[method] = function(path, opts) {
    opts.via = method;
    this.match(path, opts);
  };
}

Router.prototype.resources = function(    ) {
  var names = Array.prototype.slice.call(arguments);

  // extract a callback, then an opts object if
  // ether of them are present.
  if(typeof names[names.length - 1] == 'function') { var callback = names.pop(); }
  if(typeof names[names.length - 1] == 'object') { var opts = names.pop(); }

  // create a resource for each name then bind it
  // to this router instance.
  while(names[0]) {
    var resource = new Resource(names.shift(), opts);
    resource._bind(this, callback);
  }
};

Router.Resource = Resource;
Router.SinglularResource = SinglularResource;
Router.Scope = Scope;


function Resource(name, opts) {
  if(name == undefined) { throw new Error('Resource name is invalid'); }
  this.name = name;
  opts = opts || {};
  this.only = opts.only || [];
  this.except = opts.except || [];
  this.path = opts.path || '/';
  this.pathNames = opts.pathNames || {};
}

Resource.prototype._bind = function(router, callback) {
  var routes;

  // if only option used then only include actions
  //  within it.
  if(this.only[0]) {
    routes = [];
    for(var route in Resource.routes) {
      if(this.only.indexOf(route.action) == -1) { continue; }
      routes.push(route);
    }
  }

  // else if except option used then only include
  // actions within it.
  else if(this.except[0]) {
    routes = [];
    for(var route in Resource.routes) {
      if(this.except.indexOf(route.action) > -1) { continue; }
      routes.push(route);
    }
  }

  // else include all resource action routes.
  else {
    routes = Resource.routes.slice(0);
  }


  // if custom path names are given then apply
  // then to the routes object.
  if(this.pathNames) {
    for(var route in routes) {
      if(this.pathNames.new && route.action == 'new') {
        route.path = '/' + this.pathNames.new;
      } else if (this.pathNames.edit && route.action == 'edit') {
        route.path = '/:id/' + this.pathNames.edit;
      }
    }
  }

  // prefix each of the routes path with the
  // resource path and name then bind each
  // route to the router
  for(var route in routes) {
    console.log(route.path, this.name);
    route.path = this.path + path.join(route.path, this.name);
    router.match(route.path, {
      via: route.method,
      action: route.action,
      controller: this.name
    });
  }
};

Resource.prototype.resource = function(    ) {
  var resourceNames = Array.prototype.slice.call(arguments);

  if(typeof resourceNames[resourceNames.length - 1] == 'function') {
    var callback = resourceNames.pop();
  }
  if(typeof resourceNames[resourceNames.length - 1] == 'object') {
    var opts = resourceNames.pop();
  }

  opts.path = '/' + this.name + '/:' + this.name + 'Id' + '/' + (opts.path || '');

  for(var i = 0; i < resourceNames.length; i += 1) {
    var resource = new Resource(resourceNames[i], opts);
    resource._init(this, callback);
  }
};

Resource.routes = [
  { method: 'get', action: 'index', path: '/' },
  { method: 'get', action: 'new', path: '/new' },
  { method: 'post', action: 'create', path: '/' },
  { method: 'get', action: 'show', path: '/:id' },
  { method: 'get', action: 'edit', path: '/:id/edit' },
  { method: 'put', action: 'update', path: '/:id' },
  { method: 'patch', action: 'update', path: '/:id' },
  { method: 'delete', action: 'destroy', path: '/:id' }
];


function SinglularResource(resourceName) {

}


function Scope(opts) {

}

module.exports = Router;
