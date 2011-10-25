var app = require('express').createServer(),
    io = require('socket.io').listen(app),
    redis = require('redis'),
    client = redis.createClient(),
    crypto = require('crypto'),
    express = require('express'),
    fs = require('fs'),
    program = require('commander'),
    logger = require('winston'),
    model = require('./model.js');

logger.cli();
logger.default.transports.console.timestamp = true;

logger.info("made a new post: " + new model.ServerPost().isServer);

program.version('0.1')
    .option('-p, --port [num]', 'Set the server port (default 8080)')
    .option('-D, --database [num]', 'Set the redis database id to use (default 1)')
    .parse(process.argv);

var server = "localhost";
if(program.args.length==1) {
    server = program.args[0];
} else if(program.args.length==0) {
    logger.info("Defaulting to 'localhost' for server.");
} else {
    logger.info("Too many command line arguments. Expected 0 or 1.")
}
var port = 8080;
if(program.port) {
    logger.info("Setting port to " + program.port);
    port = program.port;
}

app.listen(port);

// Setup static serving from the static directory.
app.use(app.router);
app.use("/static", express.static(__dirname + '/static'));

// Setup the index page.
app.get('/', function(req, res) {
    res.render('index.ejs', {layout:false, locals:{"server":server,
        "port":port}});
});

io.set("log level", 0);
io.sockets.on('connection', function(socket) {
    
    socket.on("identify", function(data) {
        logger.info("identifying: ", data);
        // For now just shove both into a single string. Could call them 
        // out separately, but not sure it really matters. Storing JSON
        // is just an added headache.
        socket.set("identity", JSON.stringify(data));
        socket.emit("identify", data);
    });
    
    socket.on("post", function(data) {
        // Eventually, we'll need to start storing these. For now, just
        // broadcast them to all clients.
        socket.get("identity", function(err, identityString) {
            logger.info("identityString: " + identityString);
            var identity = JSON.parse(identityString);
            
            data["from_name"] = identity["name"];
            data["from_affiliation"] = identity["affiliation"];
            data["timestamp"] = Date.now();
            data["votes"] = [];
            
            logger.info("broadcasting post: ", data);
            
            io.sockets.emit("post", data);
        });
    });
    
    
    socket.on('disconnect', function() {
        // Do something.
    });
});


/******       REDIS SETUP        ******/
client.on("error", function(err) {
    logger.error("ERR REDIS: " + err);
});

// On ready, do some things. 
client.once("ready", function(err) {
    logger.info("Connected to redis.");
    
    // set the database.
    if(program.database) {
        if(program.database == parseInt(program.database)) {
            client.select(program.database, function() {
                logger.info("Selected database " + program.database);
            });
        }
    }
    
    // TODO technically, we should block other startup binding until this is
    // done. 
});
