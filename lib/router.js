
var path = require('path');
var send = require('send');


function Router(engine) {
  this.engine = engine;
  this._connect = connect();
  this.routes = this.engine.config.routes || {};

  var middleware = this.engine.config.middleware;

  // setup standard connect middleware
  this._stdMiddleware();

  // serve the public directory
  this._connect.use(this._serveStatic.bind(this));

  // if no static asset is found then dynamically
  // handle the request
  this._connect.use(this._serveDynamic.bind(this));
};

Router.prototype.listen = function(    ) {
  this._connect.listen.apply(this._connect, arguments);
};

Router.prototype._stdMiddleware = function() {
  this._connect.use(this._log.bind(this));
  this._connect.use(connect.bodyParser());
  this._connect.use(connect.cookieParser(this.engine.config.app.cookieSalt));
  if(this.engine.config.app.compression) { this._connect.use(connect.compress); }
};

Router.prototype._serveStatic = function(req, res, next) {
  send(req, req.url)
    .maxAge(this.engine.config.app.maxAge || 0)
    .root(path.join(this.engine.appPath, this.engine.paths.assets))
    .index('index.html')
    .hidden(false)
    .on('error')
    .on('directory')
    .pipe(res);
};

Router.prototype._serveDynamic = function(req, res, next) {
  res.end('DYN');
};

Router.prototype._log = function(req, res, next) {
  this.engine.log('');
  this.engine.log('Request for ' + req.url);
  this.engine.log('');
  next();
  this.engine.log('');
  this.engine.log('Response sent');
  this.engine.log('');
};

module.exports = Router;
