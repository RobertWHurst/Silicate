
var fs = require('fs');
var util = require('util');
var DynamicAsset = require('./dynamic-asset');


function View(viewPath) {
  this.compilers = View.fetchViewCompilers();
  DynamicAsset.call(this, viewPath);
}

util.inherits(View, DynamicAsset);


module.export = View;
