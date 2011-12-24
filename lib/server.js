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
    
    if(!_.isUndefined(callback) && !_.isNull(callback)) {
        callback();
    }
    
    io.sockets.on('connection', function(socket) {
        socket.on("identify", function(data) {
            console.log("Got an identify: " + data);
        });
    });
}

server.stop = function(callback) {
    // It would be nice to figure out how to stop the server. Not sure how
    // one goes about this, but it seems like when I run from mocha it auto
    // stops things at test end, so maybe it's okay. 
}

