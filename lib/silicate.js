
var connect = require('connect');
var path = require('path');
var util = require('util');

var Config = require('./config');
var Assets = require('./assets');
var Router = require('./router');


function Silicate(opts) {

  this.opts = opts;
  this.appPath = path.resolve(this.opts.appPath);
  this._connect = connect();

  // figureout the logPath
  if(this.opts.log) {
    this.logPath = path.resolve(this.opts.appPath, this.opts.log);
  }

  // log
  this.log();
  this.log('Booting Silicate stack');
  this.log();
  this.log('  loading configs');

  // setup the config
  this.config = new Config(path.resolve(this.appPath, this.opts.config));
  this.config.init(this._init.bind(this));
  
};

Silicate.prototype._init = function() {x

  // log
  this.log('  configs loaded');
  this.log('Using paths');
  this.log('  Models:', this.config.paths.models);
  this.log('  Views:', this.config.paths.views);
  this.log('  Controllers:', this.config.paths.controllers);
  this.log('  Assets:', this.config.paths.assets);
  this.log();

  // setup the router and assets class
  this.assets = new Assets(this);
  this.router = new Router(this);

  // link the router into connect
  this._connect.use(this.assets.middleware);
  this._connect.use(this.router.middleware);

  this._connect.use(function(req, res) {
    res.end('');
  });

};

Silicate.prototype.info = 
Silicate.prototype.log = function(    ) {
  var args = Array.prototype.slice.call(arguments, 0);
  this._log(0, args);
}

Silicate.prototype.warn = function(    ) {
  var args = Array.prototype.slice.call(arguments, 0);
  this._log(1, args);
}

Silicate.prototype.error = function(    ) {
  var args = Array.prototype.slice.call(arguments, 0);
  this._log(2, args);
}

Silicate.prototype._log = function(level, args) {

  var out = [];
  while(args[0]) {
    var arg = args.shift();

    if(typeof arg == 'object') {
      arg = util.inspect(arg, {
        depth: 6,
        colors: true
      });
    }

    out.push(arg);
  }
  out = out.join(' ') + '\n';

  if(level > 0 || this.opts.verbose) { process.stdout.write(out); }
  if(this.logPath) {
    fs.writeFile(this.logPath, out, {
      flag: 'ax'
    }, function(err) {
      if(err == undefined) { return; }
      this.logPath = undefined;
      this.log(new Error('Invalid log path'));
    });
  }
}

module.export = Silicate;
