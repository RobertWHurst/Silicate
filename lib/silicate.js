
// modules
var path = require('path');
var fs = require('fs-extra');

// libs
var Router = require('./router');


function Silicate(opts) {

  // resolve the base path and change the process
  // directory
  this.opts = opts;
  this.appPath = path.resolve(opts.appPath);

  // get the configs
  this.config = this._getComponents(this.opts.config || 'config');
  this.config.app = this.config.app || {};
  this.paths = this.config.paths || {};
  this.opts.port && (this.config.port = this.opts.port);

  //validate paths
  this.paths.models = this.paths.models || 'models';
  this.paths.helpers = this.paths.helpers || 'helpers';
  this.paths.views = this.paths.views || 'views';
  this.paths.controllers = this.paths.controllers || 'controllers';
  this.paths.assets = this.paths.assets || 'assets';

  // log paths
  this.log();
  this.log('Booting Silicate stack...');
  this.log();
  this.log('  Application path:     "' + this.appPath + '"');
  this.log('  Model directory:      "' + this.paths.models + '"');
  this.log('  View directory:       "' + this.paths.views + '"');
  this.log('  Controller directory: "' + this.paths.controllers + '"');
  this.log();

  // get the MVC components
  this.models = this._getComponents(this.paths.models);
  this.helpers = this._getComponents(this.paths.helpers);
  this.views = this._getComponents(this.paths.views);
  this.controllers = this._getComponents(this.paths.controllers);

  // log imported components
  this.log();
  this.log('Using models:');
  for(var name in this.models) {
    this.log('  - ' + name);
  }
  this.log();
  this.log('Using helpers:');
  for(var name in this.helpers) {
    this.log('  - ' + name);
  }
  this.log();
  this.log('Using views:');
  for(var name in this.views) {
    this.log('  - ' + name);
  }
  this.log();
  this.log('Using controllers:');
  for(var name in this.controllers) {
    this.log('  - ' + name);
  }
  this.log();

  // create the router
  this.router = new Router(this);
  this.router.listen(this.config.port);

  this.log();
  this.log('Created router listening on port:', this.config.port);
  this.log('  Open to requests...');
  this.log();
};

// Function fetches all MVC and related files.
// This includes configs
Silicate.prototype._getComponents = function(componentsPath) {

  componentsPath = path.join(this.appPath, componentsPath);
  if(fs.existsSync(componentsPath) == false) { return []; }
  var componentDir = fs.readdirSync(componentsPath);

  var components = {};
  for(var iC = 0; iC < componentDir.length; iC += 1) {

    var fileName = componentDir[iC];
    var componentPath = path.join(componentsPath, fileName);

    if(fs.statSync(componentPath).isFile() == false) { continue; }

    var segs = fileName.split('.');
    var name = segs.slice(0, segs.length - 1).join('.');
    var ext = segs.pop();

    switch(ext) {
      case 'js':
      case 'json':
        components[name] = require(componentPath);
        break;
      default:
        components[name] = componentPath;
    }
  }
  return components;
};

// log function
Silicate.prototype.log = function(    ) {
  if(this.opts.log) { /* TODO: implement logging to file */ }
  if(this.opts.verbose) { console.log.apply(console, arguments); }
};


module.exports = Silicate;
