
(function () {
  var client, executingOnServer;
  
  if (typeof exports !== 'undefined') {
    client = exports;
    executingOnServer = true;
    
    _ = require('underscore');
    Backbone = require('backbone');
    io = require('socket.io-client');
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
    // states: {"DISCONNECTED":0, "IDENTIFYING":1, "CONNECTED":2, "IDENTIFIED":3},
    states: {"DISCONNECTED":0, "IDENTIFYING":1, "CONNECTED":2, "IDENTIFIED":3},
    state: null,
    socket: null,
    
    connect: function(host, port) {
        
        this.setState("DISCONNECTED");
        
        this.socket = io.connect("http://"+host+":"+port).on('connect',
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
                break;
            
            case "IDENTIFIED":
                this.registerSocketListener("chat");
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
        switch(type) {
            case "chat":
                client.log("chat: " + data.text);
                break;
            case "identity-ok":
                // Server accepted our identity.
                // Eventually, the payload here should probably be a fully-encoded
                // object for us to create a model object out of. Even if we're not
                // relying on a full save/sync setup, in a situation like this
                // it will save us constantly packing/unpacking the relevant
                // properties on new objects. For now, though, just do it manually.
                // (if we just blindly pass in the data object, is it any worse?)
                this.user = new model.User(JSON.parse(data));
                client.log("Identity accepted: " + this.user.get("name") +" / " + this.user.get("affiliation"));

                this.setState("IDENTIFIED");
                break;
                
            case "identity-err":
                break;
            
            
            default:
                break;
        }
        
        this.trigger("message." + type, data);
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
    
    ///////////////////////////////////////////////////////////////////
    // THESE METHODS SEND MESSAGES TO THE SERVER OF VARIOUS SORTS    //
    ///////////////////////////////////////////////////////////////////
    
    identify: function(name, affiliation) {
        this.socket.emit("identify", {"name":name, "affiliation":affiliation});
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