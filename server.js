var app = require('express').createServer(),
    io = require('socket.io').listen(app),
    redis = require('redis'),
    client = redis.createClient(),
    crypto = require('crypto'),
    express = require('express'),
    fs = require('fs'),
    program = require('commander'),
    logger = require('winston');
    
logger.cli();
logger.default.transports.console.timestamp = true;

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
        
        // For now just shove both into a single string. Could call them 
        // out separately, but not sure it really matters. Storing JSON
        // is just an added headache.
        socket.set("identity", data["name"] + ", " + data["affiliation"]);
        socket.emit("identify", data);
    });
    
    socket.on("post", function(data) {
        logger.info("Post: " + data);
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
