#! /usr/local/bin/node

var program = require('commander');
var silicate = require('../');
var fs = require('fs-extra');

program
  .version('0.0.1')
  .usage('[options] <appPath>')
  .option('-e, --environment [name]', 'The environment you wish to run your app in', 'development')
  .option('-p, --port [number]', 'Force the application to listen on a given port. Overrides the application\'s app.json', 8000)
  .option('-v, --verbose', 'Enable verbose logging to the CLI')
  .option('-c, --config [path]', 'Path to config file', './config')
  .option('-l, --log [path]', 'Path to log file')
  .parse(process.argv);

// validate
if(typeof program.port != 'number') { throw new Error('<port> must be a number.'); }
if(typeof program.args[0] != 'string') { throw new Error('<appPath> must be a valid path to a silicate application.'); }

// execute silicate
silicate({
  env: program.environment
  verbose: program.verbose,
  port: program.port,
  config: program.config,
  appPath: program.args[0]
});