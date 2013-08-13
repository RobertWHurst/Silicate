
var fs = require('fs');
var send = require('send');
var util = require('util');
var EventEmitter = require('events').EventEmitter;


function Assets(assetsPath) {
  this.ready = false;
  if(assetsPath && fs.existsSync(assetsPath)) {
    this.path = assetsPath;
  } else {
    throw new Error('Invalid asset path');
  }
};
util.inherits(Assets, EventEmitter);

Assets.prototype.middleware = function() {
  var _this = this;
  return function(req, res, next) {
    var staticStream = send(req, req.url);
    staticStream.root(_this.path);

    staticStream.on('directory', function() {
      if(_this.listeners('directory').length) {
        _this.emit('directory', req, res, next);
        return;
      }
      res.statusCode = 301;
      res.setHeader('Location', req.url + '/');
      res.end();
    });

    staticStream.on('error', function(err) {
      if(_this.listeners('error').length) {
        _this.emit('error', err, req, res, next);
        return;
      }
      if(res.finished == false && err.status == 404) {
        next();
      }
    });

    staticStream.on('file', function(path, stat) {
      req.file = { path: path, stat: stat };
      _this.emit('file', req, res, next);
    });

    staticStream.pipe(res);
  };
};


module.exports = Assets;
