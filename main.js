var Silicate = require('./lib/silicate');

var create = module.exports = function(opts) {
  return new Silicate(opts);
};

create.Silicate = Silicate;
