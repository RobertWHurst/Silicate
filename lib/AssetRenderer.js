var fs = require('fs-extra');

function AssetRenderer(engine) {
  this.engine = engine;
  this.compilers = this.engine.compilers;
  this._coreCompilers = this.engine._coreCompilers;
  this.engine = engine;
  this.log = this.engine.log.bind(this.engine);
  this.views = this.engine.views;
};

AssetRenderer.prototype.middleware = function(req, res, next) {
  res.render = this._render(req, res, next).bind(this);
  next();
};

AssetRenderer.prototype._render = function(req, res, next) {
  return function(    ) {
    var args = Array.prototype.slice.call(arguments);

    // please note that target is added to the
    // request object by the router after it
    // resolves a target. If this method is called
    // in middleware that runs before the router's
    // _serveDynamic method
    var target = req.target || {};

    var opts = {};
    opts.layoutName = target.layout || 'main';
    opts.controllerName = target.controller || 'pages';
    opts.viewName = target.action || 'index';
    opts.data = target.data || {};
    if(typeof args[args.length - 1] == 'function') {
      opts.callback = args.pop();
    } else {
      opts.callback = function() {};
    }

    // Accept the following signatures:
    //   res.render(layoutName, controllerName, viewName, data[, callback])
    //   res.render(layoutName, viewName, data[, callback])
    //   res.render(viewName, data[, callback])
    //   res.render(viewName[, callback])
    //   res.render(data[, callback])
    //   res.render({ layoutName, controllerName, viewName, data }[, callback])
    // 
    // Any needed data that is missing will be
    // gathered from the request target, then
    // defaults
    switch(args.length) {
      case 4:
        opts.layoutName = args[0];
        opts.controllerName = args[1];
        opts.viewName = args[2];
        opts.data = args[3];
        break;
      case 3:
        opts.layoutName = args[0];
        opts.viewName = args[1];
        opts.data = args[2];
        break;
      case 2:
        opts.viewName = args[1];
        opts.data = args[2];
        break;
      case 1:
        if(typeof args[1] == 'string') {
          opts.viewName = args[1];
        } else if(typeof args[1] == 'object') {
          if(args[1].data || args[1].view || args[1].controller || args[1].layout) {
            opts = args[1];
          } else {
            opts.data = args[1];
          }
        }
        break;
    }

    // fetch the correct view if it exists
    var layout = this.engine.views[opts.layoutName];
    var err;
    if(layout == undefined) { err = new Error('Cannot render view. Layout \'' + opts.layoutName + '\' does not exist'); }
    else if(layout[opts.controllerName] == undefined) { err = new Error('Cannot render view. Controller \'' + opts.controllerName + '\' does not exist'); }
    else if(layout[opts.controllerName][opts.viewName] == undefined) { err = new Error('Cannot render view. View \'' + opts.viewName + '\' does not exist'); }
    
    // if there is an error; the view is not
    // found, then log the err, pass it to the
    // callback, and call next so a 404 page
    // can be rendered
    if(err) {
      this.log(err.message);
      opts.callback(err);
      next();
      return;
    }

    // grab the view try to render it
    var view = layout[opts.controllerName][opts.viewName];
    var segs = view.fileName.split('.');
    var viewName = segs.shift();
    var mimeType = 'text/plain';

    var exec = (function(str, data, compilerNames) {
      var compilerName = compilerNames.pop();
      var compiler = this.compilers[compilerName] || this._coreCompilers[compilerName];

      if(compiler) {
        if(compiler.compile) { str = compiler.compile(str)(data); }
        if(compiler.mimeType) { mimeType = compiler.mimeType; }
      }

      if(compilerNames[0]) { return exec(str, data, compilerNames); }
      else { return str; }
    }).bind(this);

    fs.readFile(view.path, 'utf-8', function(err, str) {
      str = exec(str, opts.data, segs);

      res.writeHead(200, 'ok', { 
        "content-type": mimeType
      });
      res.end(str);
    });
  }
}


module.exports = AssetRenderer;
