
var path = require('path');
var connect = require('connect');
var send = require('send');
var AssetRenderer = require('./assetRenderer');

function Router(engine) {
  this.engine = engine;
  this.log = this.engine.log.bind(this.engine);
  this.config = this.engine.config.assets || {};
  this.routes = this.engine.config.routes || {};

  // create the connect instance and an asset
  // renderer and pass its middleware to connect
  this._connect = connect();
  this.assetRenderer = new AssetRenderer(this.engine);
  this._connect.use(this.assetRenderer.middleware.bind(this.assetRenderer));


  // setup standard connect middleware. This is
  // external so it can be overridden if needed,
  // though this is not recomended
  this._stdMiddleware();

  // serve dynamic routes and the public directory
  this._connect.use(this._serveStatic.bind(this));
  this._connect.use(this._serveDynamic.bind(this));

  // serve the 404 if nothing else resolves
  this._connect.use(this._serve404.bind(this));
};

Router.prototype.listen = function(    ) {
  this._connect.listen.apply(this._connect, arguments);
};

Router.prototype.match = function(route, url) {
  var chunks = route.split('/');
  var uris = url.split('/');
  var data = uris.slice(0);
  while(uris[0] != undefined) {
    var chunk = chunks.shift();
    var uri = uris.shift();
    if(chunk == undefined) { return; }
    if(chunk == uri || chunk == '*') { continue; }
    else if(chunk[0] == ':') { data[chunk.slice(1)] = uri; continue; }
    else if(chunk[0] == '+') { return data; }
    else { return; }
  }
  return data;
};

Router.prototype.target = function(s, data) {
  var i = 0, ii = 0, k = '', o = '', r = '', e = false;
  while(s[i]) {
    if(s[i] == '\\') { i += 1; e = true; }
    if(s[i] == '@' && e == false) {
      ii = i + 1; k = '';
      if(s[ii] == '{') {
        ii += 1;
        while(s[ii] && s[ii] != '}') { k += s[ii]; ii += 1; }
        ii += 1;
      } else {
        while(s[ii] && s[ii].match(/[a-zA-Z0-9]/)) { k += s[ii]; ii += 1; }
      }
      if(k) { r = data[k] || ''; o += r; i = ii; }
    }
    if(s[i]) { e = false; o += s[i]; i += 1; }
  }
  return o;
};

Router.prototype._stdMiddleware = function() {
  this._connect.use(connect.bodyParser());
  this._connect.use(connect.cookieParser(this.config.cookieSalt));
  if(this.config.compressAssets) { this._connect.use(connect.compress); }
};

Router.prototype._serveStatic = function(req, res, next) {
  this.log();
  this.log('SERVE STATIC');
  this.log();
  this.log('  - Searching for static asset at request url')
  send(req, req.url)
    .maxage(this.config.maxAge || 0)
    .root(path.join(this.engine.appPath, this.engine.paths.assets))
    .index(this.config.indexFileName || 'index.html')
    .hidden(this.config.serveHiddenFiles || false)
    .on('file', this._serveStaticFile(next).bind(this))
    .on('directory', this._serveStaticDirectory(next).bind(this))
    .on('error', this._serveStaticError(next).bind(this))
    .pipe(res);
};
Router.prototype._serveStaticFile = function(next) {
  return function(url, stat) {
    this.log('  - Matching asset found for:', url);
    this.log('  - Asset Served successfully');
    this.log();
  };
};
Router.prototype._serveStaticDirectory = function(next) {
  return function(url, stat) {
    this.log('  - No matching asset found in asset path');
    next();
  }
};
Router.prototype._serveStaticError = function(next) {
  return function(err) {
    if(err.status == 404) {
      this.log('  - No matching asset found in asset path');
      next();
    } else {
      this.log('  - Static asset error:', err.message);
      this.log();
      next(err);
    }
  }
};

Router.prototype._serveDynamic = function(req, res, next) {
  this.log();
  this.log('SERVE DYNAMIC');
  this.log();

  // check the routing table
  for(var route in this.routes) {

    var data = this.match(route, req.url);
    if(data == undefined) { continue; }
    target = this.routes[route];

    // expand the target if a shorthand expression
    if(typeof target == 'string') {

      // if the target is a url then restart the resolution process
      if(target.match('/')) {

        // log the route pointer
        this.log('  - Following pointer route ' + route + ' => ' + target);
        
        // update the request and continue
        req.url = this.target(target, data);
        return this._serveDynamic(req, res, next);
      }

      // treat non urls as shorthand controller#action targets
      else {
        target = target.split('#');
        target = {
          controller: target[0] || 'pages',
          action: target[1] || 'index',
          data: data
        };

        this.log('  - Target aquired in routing table:');
        this.log('    - Controller:', target.controller);
        this.log('    - Action:', target.action);
        this.log('    - Data:', target.data);
      }
    }
  }

  // if a target could not be found in the routing
  // table then create one from the uris
  if(target == undefined) {
    var uris = req.url.split('/');
    if(uris[0] == '' && uris[1]) { uris.shift(); }
    if(uris[0] && uris[1] == undefined) {
      uris[1] = uris[0];
      uris[0] = 'pages';
    }
    target = {
      controller: uris[0] || 'pages',
      action: uris[1] || 'index',
      data: uris
    };

    this.log('  - No match found in routing table');
    this.log('  - Target created from request url:');
    this.log('    - Controller:', target.controller);
    this.log('    - Action:', target.action);
    this.log('    - Data:', target.data);
  }

  // attempt to find a controller with an action
  // that matches the target
  for(var controllerName in this.engine.controllers) {
    if(target.controller != controllerName) { continue; }
    var controller = this.engine.controllers[controllerName];

    // if the controller defines a layout then
    // add it to the target
    target.layout = controller.layout || 'main';

    if(controller[target.action]) {
      var action = controller[target.action];
    }
  }

  // augment the request and response objects
  req.target = target;

  // if an action exists then execute it
  if(typeof action == 'function') {
    this.log('  - Target found. Executing...');
    action(req, res, this.engine);
    this.log('  - Action executed successfully');
    this.log('    - Results:', execResult);
  } else {
    this.log('  - No action found matching target');
  }

  // If the action did not close the request
  // then try to automatically render a view
  // based on the uris
  if(res.finished != true) {
    this.log('  - Action did not execute a view render');
    this.log('  - Automatically invoking render with defaults based on target');
    res.render();
    return;
  } else {
    this.log('  - Action executed and rendered successfully');
    this.log();
  }

  this.log('  - No suitable action or view was found matching the target.');
  this.log();

  // if nothing can be rendered based on the uris
  next();
};

Router.prototype._serve404 = function(req, res, next) {
  res.writeHead(404, 'Not found');
  res.end();
  console.log('No suitable source for response. Closing request');
};


module.exports = Router;
