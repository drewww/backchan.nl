var program = require('commander'),
    logger = require('winston'),
    server = require('./lib/server.js');

logger.cli();
logger.default.transports.console.timestamp = true;

// stuff everything into server so it can be more easily tested

program.version('0.1')
    .option('-p, --port [num]', 'Set the server port (default 8080)')
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
if(program.port) {
    logger.info("Setting port to " + program.port);
    port = program.port;
}

var theServer = new server.BackchannlServer();
theServer.start(host, port);