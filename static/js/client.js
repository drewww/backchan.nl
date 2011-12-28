
(function () {
  var client;
  
  if (typeof exports !== 'undefined') {
    client = exports;
    
    _ = require('underscore');
    Backbone = require('backbone');
    io = require('socket.io-client');
    
  } else {
    client = this.client = {};
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
    states: {"DISCONNECTED":0, "IDENTIFYING":1, "CONNECTED":2},
    state: null,
    socket: null,
    
    connectedCallback: null,
    
    connect: function(host, port, callback) {
        
        this.connectedCallback = callback;
        this.setState("DISCONNECTED");
        
        this.socket = io.connect("http://"+host+":"+port).on('connect', function(data) {
            this.manager.setState("CONNECTED");
        });

        // I don't love this hack, but I'm stupid about closures and so I'm
        // not 100% sure how to get the "this" context into socket callbacks
        // as defined below. This is safe and not totally bad form.
        this.socket["manager"] = this;
        
    },
    
    setState: function(newState) {
        if(newState in this.states) {
            this.state = newState;
            this.configureCallbacksForState(this.state);
        }
    },
    
    configureCallbacksForState: function(state) {
        // console.log("Switching to state: " + state);
        switch(state) {
            case "DISCONNECTED":
                
                break;
            case "CONNECTED":
                if(this.connectedCallback!=null) {
                    console.log("running callback");
                    this.connectedCallback();
                }
            
                this.socket.on('identity-ok', function(data) {
                    // Server accepted our identity.

                    // Eventually, the payload here should probably be a fully-encoded
                    // object for us to create a model object out of. Even if we're not
                    // relying on a full save/sync setup, in a situation like this
                    // it will save us constantly packing/unpacking the relevant
                    // properties on new objects. For now, though, just do it manually.
                    // (if we just blindly pass in the data object, is it any worse?)
                    localUser = new model.User(data);
                    console.log("Identity accepted: " + localUser.get("name") +" / " + localUser.get("affiliation"));

                    this.manager.setState("IDENTIFIED");
                    
                    // I sort of want to remove these callbacks, but I'm not sure how to
                    // do that easily without converting all these closures into functions
                });

                this.socket.on('identity-err', function(data) {
                    // Server rejected our identity. Cases:
                    // 1. That user is passworded.
                    // 2. ???
                });
            
                break;
            
            case "IDENTIFIED":
                this.socket.on('chat', function(data) {
                    // Handle a chat message.
                    console.log("chat: " + data.text);
                });
                break;
        }
    },
    
    ///////////////////////////////////////////////////////////////////
    // THESE METHODS SEND MESSAGES TO THE SERVER OF VARIOUS SORTS    //
    ///////////////////////////////////////////////////////////////////
    
    identify: function(name, affiliation) {
        this.socket.emit("identify", {"name":name, "affiliation":affiliation});
    }
}

})()