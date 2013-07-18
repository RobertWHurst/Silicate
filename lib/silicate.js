
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
  this.config = this._getComponents(path.join(this.appPath, this.opts.config || 'config'));
  this.config.app = this.config.app || {};
  this.paths = this.config.paths || {};
  this.opts.port && (this.config.port = this.opts.port);

  //validate paths
  this.paths.models = path.join(this.appPath, this.paths.models || 'models');
  this.paths.helpers = path.join(this.appPath, this.paths.helpers || 'helpers');
  this.paths.views = path.join(this.appPath, this.paths.views || 'views');
  this.paths.controllers = path.join(this.appPath, this.paths.controllers || 'controllers');
  this.paths.assets = path.join(this.appPath, this.paths.assets || 'assets');
  this.paths.compilers = path.join(this.appPath, this.paths.compilers || 'compilers');

  // log paths
  this.log();
  this.log('Booting Silicate stack...');
  this.log();
  this.log('  Application path:     "' + this.appPath + '"');
  this.log('  Models directory:     "' + this.paths.models + '"');
  this.log('  Helpers directory:    "' + this.paths.helpers + '"');
  this.log('  Views directory:      "' + this.paths.views + '"');
  this.log('  Controllers directory:"' + this.paths.controllers + '"');
  this.log('  Assets directory:     "' + this.paths.assets + '"');
  this.log('  Compilers directory:  "' + this.paths.compilers + '"');
  this.log();

  // get the MVC components
  this.models = this._getComponents(this.paths.models);
  this.helpers = this._getComponents(this.paths.helpers);
  this.views = this._getComponents(this.paths.views);
  this.controllers = this._getComponents(this.paths.controllers);
  this._coreCompilers = this._getComponents(path.join(__dirname, '../', 'compilers'));
  this.compilers = this._getComponents(this.paths.compilers);

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
  for(var layoutName in this.views) {
    for(var controllerName in this.views[layoutName]) {
      for(var viewName in this.views[layoutName][controllerName]) {
        this.log('  - ' + layoutName + '/' + controllerName + '/' + viewName);
      }
    }
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
  var components = {};

  if(fs.existsSync(componentsPath) == false) { return components; }

  var componentDir = fs.readdirSync(componentsPath);
  for(var iC = 0; iC < componentDir.length; iC += 1) {

    var fileName = componentDir[iC];
    var segs = fileName.split('.');
    var name = segs.shift();
    var ext = segs.pop();

    var componentPath = path.join(componentsPath, fileName);
    var stat = fs.statSync(componentPath);

    if(stat.isDirectory()) {
      components[name] = this._getComponents(componentPath);
    }
    
    else if(stat.isFile()) {

      switch(ext) {
        case 'js':
        case 'json':
          components[name] = require(componentPath);
          break;
        default:
          components[name] = {
            path: componentPath,
            fileName: fileName
          };
      }
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
