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


server.BackchannlServer = function(options) {

    if(_.isUndefined(options)) options = {};
    
    _.defaults(options, {
        "test-event":false
    });
    
    model.resetIds();
    
    this.allUsers = new model.ServerUserList();
        
    this.events = new model.ServerEventList();
    

    if(options["test-event"]) {
        this.events.add(new model.ServerEvent());
    }
}

server.BackchannlServer.prototype = {
    allUsers: null,
    app: null,
    io: null,
    events: null,
    
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

                user.connected(socket);
                
                logger.debug("user.connected: " + user.get("connected"));

                socket.set("identity", user.id);
                socket.emit("identity-ok", JSON.stringify(user.toJSON()));
            });
            
            socket.on("join", function(data) {
                socket.get("identity", function(err, userId) {
                    if (!socket.server.validateUserIdentified(socket, userId, "join"))
                        return;
                    
                    var user = socket.server.allUsers.get(userId);
                    
                    // Check if the user is in an event already.
                    var inEvent = null;
                    if(user.isInEvent()) {
                        inEvent = socket.server.events.get(user.get("inEvent"));
                    }
                    
                    if(!socket.server.validateEventId(socket, data["eventId"], "join"))
                        return;
                    
                    var e = socket.server.events.get(data["eventId"]);
                    
                    // Now we know we actually have a valid one to join. Leave
                    // the old one first, then join the new one.
                    if(!_.isNull(inEvent)) inEvent.userLeft(user);
                    
                    // This command will join this socket to a particular event.
                    // At this point we've error-checked everything and can
                    // join the user to this event.
                    e.userJoined(user);
                    
                    
                    socket.emit("join-ok");
                });
            });
            
            socket.on("leave", function(data) {
                socket.get("identity", function(err, userId) {
                    if (!socket.server.validateUserIdentified(socket, userId, "leave"))
                        return;
                
                    var user = socket.server.allUsers.get(userId);
                    
                    // Check if the user is in an event already.
                    if(!user.isInEvent()) {
                        socket.emit("leave-err", {"err":"User not in an event."});
                        return;
                    }
                    var inEvent = socket.server.events.get(user.get("inEvent"));
                    inEvent.userLeft(user);
                    
                    socket.emit("leave-ok");
                });
            });
            
            socket.on("disconnect", function(data) {
                socket.get("identity", function(err, userId) {

                    // userId will be null if the client never identified
                    // themselves. But that's okay - just drop out.
                    // We don't use validateUserIdentified here because
                    // there's no message to respond with because it's a dc.
                    if(userId==null) {
                        return;
                    }
                    
                    logger.debug("user " + userId + " disconnected");
                    
                    var user = socket.server.allUsers.get(userId);
                    
                    user.disconnected(socket);
                    
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
    },
    
    validateUserIdentified: function(fromSocket,userId, messageType) {
        if(_.isNull(userId) || _.isUndefined(userId)) {
            logger.warn("received a command from a socket that hadn't identified yet.");
            fromSocket.emit(messageType + "-err", {"err":"User not identified yet."});
            return false;
        } else {
            return true;
        }
    },
    
    validateEventId: function(fromSocket, eventId, messageType) {
        if(_.isUndefined(eventId)) {
            fromSocket.emit(messageType + "-err", {"err":"No eventId present"});
            return false;
        }
        
        if(_.isNull(eventId)) {
            fromSocket.emit(messageType+"-err", {"err":"EventID must not be null."});
            return false;
        }

        if(!(_.isNumber(eventId))) {
            fromSocket.emit(messageType + "-err", {"err":"Wrong datatype for eventId"});
            return false;
        }

        var e = fromSocket.server.events.get(eventId);

        if(_.isNull(e) || _.isUndefined(e)) {
            fromSocket.emit(messageType + "-err", {"err":"Invalid eventId."});
            return false;
        }
        
        return true;
    }
}

// Merge in the Backbone events methods to make registering or callbacks
// easy.
_.extend(server.BackchannlServer.prototype, Backbone.Events);

