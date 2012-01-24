var program = require('commander'),
    logger = require('winston'),
    server = require('./lib/server.js'),
    dispatch = require('./lib/dispatch.js');

logger.cli();
logger.default.transports.console.timestamp = true;

// stuff everything into server so it can be more easily tested

program.version('0.1')
    .option('-p, --port [num]', 'Set the server port (default 8080)')
    .option('-P, --production', 'Sets the server to production mode (default false)')
    .option('-l, --load', 'Loads users and events from disk, otherwise starts fresh (default false)')
    .option('-d, --dispatcher [name]', 'Sets the dispatcher type (default \"base\")')
    .parse(process.argv);

var host = "localhost";
if(program.args.length==1) {
    host = program.args[0];
} else if(program.args.length==0) {
    logger.info("Defaulting to 'localhost' for host.");
} else {
    logger.info("Too many command line arguments. Expected 0 or 1.")
}

var port = 8080;
var production = false;
var load = false;

if(program.port) {
    logger.info("Setting port to " + program.port);
    port = program.port;
}

if(program.production) {
    production = true;
    load = true;
} else {
    // if we're not in production mode, then check and see if we want to
    // load. if we don't load, the server auto-creates a dummy event for
    // us to test with.
    
    if(program.load) {
        load = true;
    }
}

var dispatch = "base";
if(program.dispatch) {
    if(dispatch.getDispatcherForName(program.dispatch) == null) {
        logger.warning(program.dispatch + " is an invalid dispatch type. Defaulting to 'base'.");
    } else {
        dispatch = program.dispach;
    }
}

logger.info("production? " + production);
logger.info("load? " + load);
logger.info("dispatch: " + dispatch);

var theServer = new server.BackchannlServer({
    "production":production,
    "load":load,
    "dispatcher":dispatch});
    
    
logger.info("starting server on " + host + ":" + port);
theServer.start(host, port);