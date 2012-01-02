
(function () {
  var client, executingOnServer;
  
  if (typeof exports !== 'undefined') {
    client = exports;
    executingOnServer = true;
    
    _ = require('underscore');
    Backbone = require('backbone');
    io = require('socket.io-client');
    model = require('./model.js');
    winston = require('winston');
    
    logger= new (winston.Logger)({
        transports: [
            new (winston.transports.File)({
                filename:'client.log',
                timestamp:true,
                levels:winston.syslog,
                json:false
                })
        ]
    });
  } else {
    client = this.client = {};
    executingOnServer = false;
  }
  
/* Deal with IE not having console.log */
if (typeof console === "undefined" || typeof console.log === "undefined") {
  console = {};
  console.log = function() {};
}

client.ConnectionManager = function() {
    // Initialize a ConnectionManager object.
}

client.ConnectionManager.prototype = {
    
    user: null,
    event: null,
    states: {"DISCONNECTED":0, "IDENTIFYING":1, "CONNECTED":2, "IDENTIFIED":3,
             "JOINED":4},
    state: null,
    socket: null,
    
    connect: function(host, port, options) {
        
        this.setState("DISCONNECTED");
        
        if(_.isUndefined(options)) options = {};
        _.defaults(options, {
            "auto-identify": false,
            "auto-join": false
        });
        
        if(options["auto-identify"]) {
            // Setup a default call and response behavior with
            // identification (and ultimately joining) to make testing
            // with this client more streamlined and not having quite
            // so much indirection.
            this.bind("state.CONNECTED", function() {
                this.identify("user-" + (Math.floor(Math.random()*1000)),
                    "company-" + (Math.floor(Math.random()*1000)));
            });
        }
        
        if(options["auto-join"]) {
            this.bind("state.IDENTIFIED", function() {
                // This requires that the server have an event with id 0.
                // This will be true if the server is started with 
                // test-event: true in its constructor/reset options.
                this.join(0);
            });
        }
        
        this.socket = io.connect("http://"+host+":"+port,
            {'force new connection': true}).on('connect',
                function(data) {
                    this.manager.setState.call(this.manager, "CONNECTED");
                });
        
        // I don't love this hack, but I'm stupid about closures and so I'm
        // not 100% sure how to get the "this" context into socket callbacks
        // as defined below. This is safe and not totally bad form.
        this.socket["manager"] = this;
    },
    
    setState: function(newState) {
        // client.log("this.states: " + this.states);
        if(newState in this.states) {
            this.state = newState;
            this.configureCallbacksForState(this.state);
            this.trigger("state." + this.state);
            client.log("Switched to state: " + this.state);
        }
    },
    
    configureCallbacksForState: function(state) {
        // client.log("Switching to state: " + state);
        switch(state) {
            case "DISCONNECTED":
                
                break;
            case "CONNECTED":
                this.registerSocketListener("identity-ok");
                this.registerSocketListener("identity-err");
                
                this.registerSocketListener("join-ok");
                this.registerSocketListener("join-err");
                
                this.registerSocketListener("leave-ok");
                this.registerSocketListener("leave-err");
                
                this.registerSocketListener("test");
                break;
            
            case "IDENTIFIED":
                break;
            
            case "JOINED":
                this.registerSocketListener("chat");
                this.registerSocketListener("chat-ok");
                this.registerSocketListener("chat-err");
                break;
            
        }
        
    },
    
    registerSocketListener: function(type) {
        client.log("Registering socket listener: " + type);
        this.socket.on(type, function(data) {
            this.manager.receivedMessage.call(this.manager, type, data);
        });
    },
    
    receivedMessage: function(type, data) {
        client.log("message." + type);
        
        var arg = null;
        
        switch(type) {
            case "identity-ok":
                // Server accepted our identity.
                // Eventually, the payload here should probably be a fully-encoded
                // object for us to create a model object out of. Even if we're not
                // relying on a full save/sync setup, in a situation like this
                // it will save us constantly packing/unpacking the relevant
                // properties on new objects. For now, though, just do it manually.
                // (if we just blindly pass in the data object, is it any worse?)
                this.user = new model.User(JSON.parse(data));
                client.log("Identity accepted: " + this.user.get("name") +
                    " / " + this.user.get("affiliation"));
                
                arg = this.user;
                
                this.setState("IDENTIFIED");
                break;
                
            case "identity-err":
                break;
            
            case "join-ok":
                this.event = new model.Event(JSON.parse(data));
                client.log("Local event set: " + this.event.get("title"));
                
                arg = this.event;
                
                this.setState("JOINED");
                break;
            
            case "leave-ok":
                
                // Need to be careful about dropping back into this state - 
                // I think there are some implicit assumptions about only
                // moving up in the state path, not reverting.
                // Adding this in caused some truly weird problems. Come
                // back to it later. We probably need some sort of 
                // this.setState("IDENTIFIED");
                break;
            
            case "chat":
                var chat = new model.Chat(JSON.parse(data));
                client.log("Received chat: " + chat.get("fromName") + ": "
                    + chat.get("text"));
                
                // register the new chat message with the event.
                this.event.addChat(chat);
                
                arg = chat;
                break;
                
            
            default:
                break;
        }
        
        this.trigger("message." + type, arg);
    },
    
    // There are two kinds of callbacks clients of ConnectionManager might
    // want to register for:
    //
    // 1. ConnectionManager state changes.
    // 2. Raw messages from the server.
    //
    // We're going to handle both of these transparently by triggering
    // events. The first type will be prefixed with 'state.' and the second
    // type will be 'message.'.
    //
    // The tricky part is that you can only register for 'message.' type 
    // events if they've already been registered on the socket. 
    
    disconnect: function() {
        this.setState("DISCONNECTED");
        this.socket.disconnect();
    },
    
    ///////////////////////////////////////////////////////////////////
    // THESE METHODS SEND MESSAGES TO THE SERVER OF VARIOUS SORTS    //
    ///////////////////////////////////////////////////////////////////
    
    identify: function(name, affiliation) {
        this.socket.emit("identify", {"name":name, "affiliation":affiliation});
    },
    
    join: function(eventId) {
        this.socket.emit("join", {"eventId":eventId});
    },
    
    leave: function() {
        this.socket.emit("leave");
    },
    
    chat: function(text) {
        this.socket.emit("chat", {"text":text});
    }
}

client.log = function(msg) {
    if(executingOnServer) {
        logger.info(msg);
    } else {
        console.log(msg);
    }
}

// Merge in the Backbone events methods to make registering or callbacks
// easy.
_.extend(client.ConnectionManager.prototype, Backbone.Events);

})()