var express = require('express'),
    socket_lib = require('socket.io'),
    express = require('express'),
    fs = require('fs'),
    _ = require('underscore')._,
    model = require('./server-model.js'),
    actions = require('./actions.js'),
    winston = require('winston'),
    dispatch = require('./dispatch.js');

var logger= new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            filename:'server.log',
            timestamp:true,
            json:false,
            level: "debug"
            })
    ],
    levels: winston.config.syslog.levels
});



// This is a little tricky but I think it's okay so far? Passes tests, at
// least.
_.extend(model, require('../static/js/model.js'));

// Would be nice to figure out how to supress that socket.io "started" message

server = exports;


server.BackchannlServer = function(options) {
    this.reset(options);
}

server.BackchannlServer.prototype = {
    allUsers: new model.ServerUserList(),
    app: null,
    io: null,
    events: new model.ServerEventList(),
    
    reset: function(options) {
        
        if(_.isUndefined(options)) options = {};
        
        logger.debug("RESET options: " + JSON.stringify(options));
        logger.debug("hasDispatch: " + options["dispatcher"]);

        _.defaults(options, {
            "test-event":false,
            "dispatcher":"base",
            "dispatcher-options": {},
            "persist":false
        });

        model.resetIds();
        
        // tell actions + models that they should be persisting.
        actions.journalingEnabled = options["persist"];
        server_model.setPersist(options["persist"]);
        
        // Disconnect any sockets that we have open. There might be a more
        // direct way to do this, but I don't know it at the moment.
        this.allUsers.each(function(user) {
            user.disconnectAllSockets();
        });
        
        this.allUsers = new model.ServerUserList();

        this.events = new model.ServerEventList();

        if(options["test-event"]) {
            var newEvent = new model.ServerEvent({
                "dispatcher":options["dispatcher"],
                "dispatcher-options":options["dispatcher-options"],
            });
            
            newEvent.save();
            this.events.add(newEvent);
        }
    },
    
    start: function(host, port) {
        logger.info("                                             ")
        logger.info("---------------------------------------------");
        logger.info("Starting up server on " + host + ":" + port);
        logger.debug("users list: " + this.allUsers);
        this.app = express.createServer();
        this.io = socket_lib.listen(this.app, {"log level":0});
        this.io.set("log level", 0);
        this.io.sockets.server = this;
        model.io(this.io);
        
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

                    user.save();
                        
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
                    socket.get("eventId", function(err, eventId) {
                        if (!socket.server.validateUserIdentified(socket, userId, "join"))
                            return;
                        
                        var user = socket.server.allUsers.get(userId);
                        
                        // Check if the user is in an event already.
                        var curEvent = null;
                        if(!_.isNull(eventId) && !_.isUndefined(eventId)) {
                            curEvent = socket.server.events.get(eventId);
                        }
                        
                        if(!socket.server.validateEventId(socket, data["eventId"], "join"))
                            return;
                        
                        var eventToJoin = socket.server.events.get(data["eventId"]);
                        
                        // Now we know we actually have a valid one to join. Leave
                        // the old one first, then join the new one.
                        if(!_.isNull(curEvent))
                            user.leftEventWithSocket(curEvent, socket);
                        
                        socket.emit("join-ok",
                            JSON.stringify(eventToJoin.toJSON()));
                        
                        // doing this after we say "join-ok" means that when we
                        // send mesages to the client after they join, they will
                        // have the right listeners attached (hopefully)
                        //
                        // This command will join this socket to a particular event.
                        // At this point we've error-checked everything and can
                        // join the user to this event.
                        user.joinedEventWithSocket(eventToJoin, socket);
                    });
                });
            });
            
            socket.on("leave", function(data) {
                socket.get("identity", function(err, userId) {
                    socket.get("eventId", function(err, eventId) {
                        if (!socket.server.validateUserIdentified(socket, userId, "leave"))
                            return;
                
                        var user = socket.server.allUsers.get(userId);
                    
                        // Check if the user is in an event already.
                        if(_.isNull(eventId) || _.isUndefined(eventId)) {
                            socket.emit("leave-err", {"err":"User not in an event."});
                            return;
                        }
                        
                        var curEvent = socket.server.events.get(eventId);
                        user.leftEventWithSocket(curEvent, socket);
                    
                        socket.emit("leave-ok");
                    });
                });
            });
            
            socket.on("chat", function(data) {
                socket.get("identity", function(err, userId) {
                    socket.get("eventId", function(err, eventId) {
                        
                        logger.debug("In the chat handler");
                    
                        if (!socket.server.validateUserIdentified(socket, userId, "chat"))
                            return;
                        var user = socket.server.allUsers.get(userId);
                        
                        
                        if(_.isNull(eventId) || _.isUndefined(eventId)) {
                            socket.emit("chat-err", {"err":"User must be in the event to send chat messages."});
                            return;
                        }
                        
                        var event = socket.server.events.get(eventId);
                        
                        // For now, chat will go to an entire event. Later, we'll
                        // add in the ability to scope it to sections. Won't be
                        // too hard.
                        
                        if(!socket.server.validateChatText(socket, data["text"]))
                            return;
                        
                        var action = new actions.EventAction("CHAT", user, event, data);
                        action.execute();
                        
                        socket.emit("chat-ok");
                    });
                });
            });
            
            socket.on("post", function(data) {
                socket.get("identity", function(err, userId) {
                    socket.get("eventId", function(err, eventId) {
                        if (!socket.server.validateUserIdentified(socket, userId, "post"))
                            return;
                        var user = socket.server.allUsers.get(userId);
                    
                        if(_.isNull(eventId) || _.isUndefined(eventId)) {
                            socket.emit("chat-err", {"err":"User must be in the event to post."});
                            return;
                        }
                    
                        var event = socket.server.events.get(eventId);
                    
                        if(!socket.server.validatePostText(socket, data["text"]))
                            return;
                        
                        var action = new actions.EventAction("POST", user, event, data);
                        action.execute();
                        
                        socket.emit("post-ok");
                    });
                });
            });
            
            socket.on("vote", function(data) {
                socket.get("identity", function(err, userId) {
                    socket.get("eventId", function(err, eventId) {
                        if (!socket.server.validateUserIdentified(socket, userId, "post"))
                            return;
                        var user = socket.server.allUsers.get(userId);
                    
                        if(_.isNull(eventId) || _.isUndefined(eventId)) {
                            socket.emit("chat-err", {"err":"User must be in an event to vote."});
                            return;
                        }
                        var event = socket.server.events.get(eventId);
                    
                        if(!socket.server.validatePostId(socket, data["postId"],
                            event, "vote"))
                            return;
                    
                        var post = event.get("posts").get(data["postId"]);
                        
                        var action = new actions.EventAction("VOTE", user, event,
                            {"post":post});
                        
                        if(action.execute()) {
                            socket.emit("vote-ok");
                        } else {
                            socket.emit("vote-err",
                                {"err":"User has already voted on that post."});
                        }
                    });
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
            logger.warning("received a command from a socket that hadn't identified yet.");
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
    },
    
    validatePostId: function(fromSocket, postId, event, messageType) {
        if(_.isUndefined(postId)) {
            fromSocket.emit(messageType + "-err", {"err":"No postId present"});
            return false;
        }
        
        if(_.isNull(postId)) {
            fromSocket.emit(messageType+"-err", {"err":"PostId must not be null."});
            return false;
        }

        if(!(_.isNumber(postId))) {
            fromSocket.emit(messageType + "-err", {"err":"Wrong datatype for postId"});
            return false;
        }
        
        var postInEvent = event.get("posts").get(postId);
        
        if(_.isNull(postInEvent) || _.isUndefined(postInEvent)) {
            fromSocket.emit(messageType + "-err", {"err":"No post exists in this event with that id."});
            return false;
        }
        
        return true;
    },
    
    validateChatText: function(fromSocket, text) {
        if(_.isUndefined(text)) {
            fromSocket.emit("chat-err", {"err":"Chat messages must not be empty."});
            return false;
        }
        
        if(_.isNull(text)) {
            fromSocket.emit("chat-err", {"err":"Chat messages must not be null."});
            return false;
        }
        
        // TODO Add in some text validation here. Is it too long? etc.
        
        return true;
    },

    validatePostText: function(fromSocket, text) {
        if(_.isUndefined(text)) {
            fromSocket.emit("post-err", {"err":"Posts must not be empty."});
            return false;
        }
        
        if(_.isNull(text)) {
            fromSocket.emit("post-err", {"err":"Posts must not be null."});
            return false;
        }
        
        // TODO Add in some text validation here. Is it too long? etc.
        
        return true;
    },
    
    getUser: function(userId) {
        return this.allUsers.get(userId);
    }
}

// Merge in the Backbone events methods to make registering or callbacks
// easy.
_.extend(server.BackchannlServer.prototype, Backbone.Events);

