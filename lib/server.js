var app = require('express').createServer(),
    io = require('socket.io').listen(app).set("log level", 0),
    express = require('express'),
    fs = require('fs'),
    _ = require('underscore'),
    model = require('./server-model.js'),
    winston = require('winston');

var logger= new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            filename:'server.log',
            timestamp:true,
            levels:winston.syslog,
            json:false,
            })
    ]
});

// This is a little tricky but I think it's okay so far? Passes tests, at
// least.
_.extend(model, require('../static/js/model.js'));

// Would be nice to figure out how to supress that socket.io "started" message

server = exports;

var allUsers = new model.ServerUserList();

server.start = function(host, port, callback) {
    logger.debug("Starting up server on " + host + ":" + port);
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
        logger.debug("Received connection: " + socket);
        socket.on("identify", function(data) {
            logger.debug("#identify: " + data["name"] + "/"
                + data["affiliation"]);
            var user = allUsers.get_user(data["name"], data["affiliation"]);
            
            if(_.isUndefined(user)) {
                // User is unknown, making a new one.
                user = new model.ServerUser(data);
                
                // We should write a validation function on the user to make
                // sure that bad stuff isn't added. Do this next.
                allUsers.add(user);
            }
            
            user.set({"connected":true});
            
            socket.set("identity", user.id);
            socket.emit("identity-ok", JSON.stringify(user.toJSON()));
        });
    });
    
    if(!_.isUndefined(callback) && !_.isNull(callback)) {
        callback();
    }
    logger.info("Server started successfully.");
}

server.stop = function(callback) {
    app.close();
    
    logger.info("Server stopped.");
    if(!_.isUndefined(callback) && !_.isNull(callback)) {
        callback();
    }
}

