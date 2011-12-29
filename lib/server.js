var express = require('express'),
    socket_lib = require('socket.io'),
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


server.BackchannlServer = function() {
    this.allUsers = new model.ServerUserList();
}

server.BackchannlServer.prototype = {
    allUsers: null,
    app: null,
    io: null,
    
    start: function(host, port) {
        logger.info("                                             ")
        logger.info("---------------------------------------------");
        logger.info("Starting up server on " + host + ":" + port);
        logger.debug("users list: " + this.allUsers);
        this.app = express.createServer();
        this.io = socket_lib.listen(this.app, {"log level":0});
        this.io.set("log level", 0);
        
        this.io.sockets.server = this;
        
        this.app.listen(port);

        // Setup static serving from the static directory.
        this.app.use(this.app.router);
        this.app.use("/static", express.static(__dirname + '/../static'));

        // Setup the index page.
        this.app.get('/', function(req, res) {
            res.render('index.ejs', {layout:false, locals:{"host":host,
                "port":port}});
        });

        model.resetIds();

        this.io.sockets.on('connection', function(socket) {
            logger.debug("Received connection: " + socket);
            socket.server = this.server;
            
            socket.on("identify", function(data) {
                
                
                logger.debug("#identify: " + data["name"] + "/"
                    + data["affiliation"]);
                var user = socket.server.allUsers.getUser(data["name"], data["affiliation"]);

                if(_.isUndefined(user)) {
                    // User is unknown, making a new one.
                    user = new model.ServerUser({name:data["name"],
                        affiliation:data["affiliation"]});

                    // We should write a validation function on the user to make
                    // sure that bad stuff isn't added. Do this next.
                    socket.server.allUsers.add(user);
                }

                user.set({"connected":user.get("connected")+1});
                
                logger.debug("user.connected: " + user.get("connected"));

                socket.set("identity", user.id);
                socket.emit("identity-ok", JSON.stringify(user.toJSON()));
            });
            
            socket.on("disconnect", function(data) {
                socket.get("identity", function(err, userId) {

                    // userId will be null if the client never identified
                    // themselves. But that's okay - just drop out.
                    if(userId==null) {
                        return;
                    }
                    
                    logger.debug("user " + userId + " disconnected");
                    
                    var user = socket.server.allUsers.get(userId);
                    user.set({"connected":user.get("connected")-1});
                    socket.server.trigger("client.disconnected");
                });
            });
        });

        logger.info("Server started successfully.");
        this.trigger("started");
    },
    
    stop: function() {
        this.app.close();
        logger.info("Server stopped.");
        this.trigger("stopped");
    }
}

// Merge in the Backbone events methods to make registering or callbacks
// easy.
_.extend(server.BackchannlServer.prototype, Backbone.Events);

