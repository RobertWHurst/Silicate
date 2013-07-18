#! /usr/local/bin/node

var program = require('commander');
var silicate = require('../');
var fs = require('fs-extra');

program
  .version('0.0.1')
  .usage('[options] <appPath>')
  .option('-p, --port [port]', 'Force the application to listen on a given port. Overrides the application\'s app.json', 8000)
  .option('-v, --verbose', 'Enable verbose logging to the CLI')
  .option('-c, --config [configPath]', 'Path to config file', './config')
  .parse(process.argv);

// validate
if(typeof program.port != 'number') { throw new Error('<port> must be a number.'); }
if(typeof program.args[0] != 'string') { throw new Error('<appPath> must be a valid path to a silicate application.'); }

// execute silicate
silicate({
  verbose: program.verbose,
  port: program.port,
  config: program.config,
  appPath: program.args[0]
});