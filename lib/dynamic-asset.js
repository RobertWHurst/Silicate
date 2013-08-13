
var util = require('util');
var events = require('events');
var path = require('path');
var fs = require('fs');


function DynamicAsset(assetPath) {

  this.ready = false;

  this.filePath = assetPath;
  this.fileName = path.basename(assetPath);
  this.fileType = this._getFileType(this.fileName);
  this.fileCompilers = this._getCompilers(this.fileName);

  this._compilers = {};

  var _this = this;
  fs.readFile(this.filePath, 'utf-8', function(err, src) {
    if(err) {
      _this.error = err;
      _this.emit('error', err);
    } else {
      _this.src = src;
      _this.emit('ready', src);
    }
  });
}

util.inherits(DynamicAsset, events.EventEmitter);

DynamicAsset.prototype._getFileType = function(fileName) {
  var segs = this._segmentFileName(fileName);
  return segs[1];
};

DynamicAsset.prototype._getCompilers = function(fileName) {
  var segs = this._segmentFileName(fileName);
  return segs.slice(2);
};

DynamicAsset.prototype.render = function(data, callback) {

  if(this._lastRenderedData == data) {
    callback(undefined, this._lastRenderedSrc);
    return;
  }

  this._lastRenderedData = data;
  
  var _this = this;
  var i = this.fileCompilers.length;
  (function exec() {
    var compilerName = _this.fileCompilers[i];
    var compiler = _this._compilers[compilerName];

    if(typeof compiler != 'function') {
      callback(new Error('No compiler for ext \'' + compilerName + '\''));
      return;
    }

    compiler(function(err, src) {
      if(i > 0) { exec(src, data); }
      else {
        this._lastRenderedSrc = src;
        callback(undefined, src);
      }
    });

    i -= 1;
  })(src, data);
};

DynamicAsset.prototype._segmentFileName = function(fileName) {
  var segs = fileName.split('.');
  while(segs[0] == '') { segs.shift(); }
  while(segs[segs.length - 1] == '') { segs.pop(); }
  return segs;
}

module.export = DynamicAsset;