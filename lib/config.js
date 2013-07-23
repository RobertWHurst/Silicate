
var fs = require('fs');
var path = require('path');


function Config(configPath) {
  this.ready = false;
  if(configPath && fs.existsSync(configPath)) {
    this.path = configPath;
  } else {
    throw new Error('Invalid config path');
  }
}

Config.prototype.init = function(callback) {
  var callback = callback || noop;
  var _this = this;
  fs.readdir(this.path, function(err, dir) {
    if(err) { callback(err, null); return; }
    if(dir.length == 0) {
      _this.ready = true;
      callback(null, _this);
      return;
    }
    var i = 0;
    while(dir[0]) {
      var fileName = dir.shift();
      var fileExt = path.extname(fileName);
      if(fileExt != '.json') { continue; }
      var fileId = path.basename(fileName, fileExt);
      var filePath = path.join(_this.path, fileName);
      i += 1;
      fs.stat(filePath, function(err, stat) {
        if(stat.isFile() == false) { i -= 1; return; }
        fs.readFile(filePath, 'utf-8', function(err, src) {
          i -= 1;
          if(err) { return; }
          try { _this[fileId] = JSON.parse(src); }
          catch(err) {}
          if(i < 1) {
            _this._setDefaults();
            _this.ready = true;
            callback(null, _this);
          }
        });
      });
    }
  });
};

Config.prototype._setDefaults = function() {

  // paths
  this.paths = this.paths || {};
  this.paths.models = this.paths.models || 'models';
  this.paths.views = this.paths.views || 'views';
  this.paths.controllers = this.paths.controllers || 'controllers';
  this.paths.assets = this.paths.assets || 'assets';

};


module.exports = Config;
function noop() {};

