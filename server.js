var app = require('express').createServer(),
    io = require('socket.io').listen(app),
    redis = require('redis'),
    client = redis.createClient(),
    crypto = require('crypto'),
    express = require('express'),
    fs = require('fs'),
    program = require('commander');
    
    
program.version('0.1')
    .option('-p, --port [num]', 'Set the server port (default 8080)')
    .parse(process.argv);

var server = "localhost";
if(program.args.length==1) {
    server = program.args[0];
} else if(program.args.length==0) {
    console.log("Defaulting to 'localhost' for server.");
} else {
    console.log("Too many command line arguments. Expected 0 or 1.")
}
var port = 8080;
if(program.port) {
    console.log("Setting port to " + program.port);
    port = program.port;
}

app.listen(port);

app.use(app.router);
app.use("/static", express.static(__dirname + '/static'));


io.sockets.on('connection', function(socket) {

    socket.on('disconnect', function() {
        // Do something.
    });
});


/******       REDIS SETUP        ******/
client.on("error", function(err) {
    console.log("ERR REDIS: " + err);
});

// On ready, do some things. 
client.once("ready", function(err) {
});
