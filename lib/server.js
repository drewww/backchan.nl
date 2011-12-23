var app = require('express').createServer(),
    io = require('socket.io').listen(app),
    express = require('express'),
    fs = require('fs'),

server = exports;


server.start = function(host, port, callback) {
    app.listen(port);

    // Setup static serving from the static directory.
    app.use(app.router);
    app.use("/static", express.static(__dirname + '/static'));

    // Setup the index page.
    app.get('/', function(req, res) {
        res.render('index.ejs', {layout:false});
    });

    app.get('/app', function(req, res) {
        res.render('app.ejs', {layout:false, locals:{"host":host,
            "port":port}});
    });

    io.set("log level", 0);
    
    callback();
}

server.stop = function(callback) {
    
}

