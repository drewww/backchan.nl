var app = require('express').createServer(),
    io = require('socket.io').listen(app).set("log level", 0),
    express = require('express'),
    fs = require('fs'),
    _ = require('underscore');

// Would be nice to figure out how to supress that socket.io "started" message

server = exports;

server.start = function(host, port, callback) {
    app.listen(port);

    // Setup static serving from the static directory.
    app.use(app.router);
    app.use("/static", express.static(__dirname + '/../static'));

    // Setup the index page.
    app.get('/', function(req, res) {
        res.render('index.ejs', {layout:false, locals:{"host":host,
            "port":port}});
    });
    
    
    io.sockets.on('connection', function(socket) {
        socket.on("identify", function(data) {
            console.log("Got an identify: " + data);
        });
    });
    
    if(!_.isUndefined(callback) && !_.isNull(callback)) {
        callback();
    }
}

server.stop = function(callback) {
    app.close();
    
    if(!_.isUndefined(callback) && !_.isNull(callback)) {
        callback();
    }
}

