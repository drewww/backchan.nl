// Need to do some tricky things to make this testable in node, but we'll get
// back to that later. For now make it work in a browser.

/* Deal with IE not having console.log */
if (typeof console === "undefined" || typeof console.log === "undefined") {
  console = {};
  console.log = function() {};
}

ConnectionManager = {
    
    user: null,
    states: {"DISCONNECTED":0, "IDENTIFYING":1, "CONNECTED":2},
    state: null,
    socket: null;
    
    
    connect: function(server, port) {
        setupGlobals();
        this.setState("DISCONNECTED");
        this.socket = io.connect("http://"+server+":"+port);
    },
    
    setState: function(newState) {
        if(state in states) {
            this.state = state;
            this.configureCallbacksForState();
        }
    }
    
    configureCallbacksForState: function(state) {
        switch(state) {
            case "DISCONNECTED":
                socket.on('connect', function(data) {
                    console.log("Connected to server.");
                    this.setState("CONNECTED");
                });
                break;
            case "CONNECTED":
                socket.on('identity-ok', function(data) {
                    // Server accepted our identity.

                    // Eventually, the payload here should probably be a fully-encoded
                    // object for us to create a model object out of. Even if we're not
                    // relying on a full save/sync setup, in a situation like this
                    // it will save us constantly packing/unpacking the relevant
                    // properties on new objects. For now, though, just do it manually.
                    // (if we just blindly pass in the data object, is it any worse?)
                    localUser = new model.User(data);
                    console.log("Identity accepted: " + localUser.get("name") +" / " + localUser.get("affiliation"));

                    this.setState("IDENTIFIED");
                    
                    // I sort of want to remove these callbacks, but I'm not sure how to
                    // do that easily without converting all these closures into functions
                });

                socket.on('identity-err', function(data) {
                    // Server rejected our identity. Cases:
                    // 1. That user is passworded.
                    // 2. ???
                });
            
                break;
            
            case "IDENTIFIED":
                socket.on('chat', function(data) {
                    // Handle a chat message.
                    console.log("chat: " + data.text);
                });
                break;
        }
    }
    
    ///////////////////////////////////////////////////////////////////
    // THESE METHODS SEND MESSAGES TO THE SERVER OF VARIOUS SORTS    //
    ///////////////////////////////////////////////////////////////////
    
    identify: function(name, affiliation) {
        socket.emit("identify", {"name":name, "affiliation":affiliation});
    }
}
