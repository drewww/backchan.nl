var _ = require('underscore')._
    Backbone = require('backbone'),
    model = require('../static/js/model.js'),
    crypto = require('crypto'),
    logger = require('winston'),

// rename exports just for clarity.
server_model = exports;

logger.cli();
logger.default.transports.console.timestamp = true;

// The server objects need a reference to the socket.io object so they can
// generate their own messages. This is a little clunky, but the idea of
// handing it in to every object on startup is a little horrifying. So,
// here it is.
var modelIO;
server_model.io = function(serverIo) {
    modelIO = serverIo;
}

var nextPostId=0;
server_model.ServerPost = model.Post.extend({
    
    initialize: function(args) {
        model.Post.prototype.initialize.call(this, args);
        
        // Set and increment the post id.
        if(!("id" in args)) {
            this.set({id:nextPostId++});
        }
    },
});

var nextUserId=0;
server_model.ServerUser = model.User.extend({
    
    initialize: function(args) {
        model.User.prototype.initialize.call(this, args);
        
        // Set and increment the post id.
        if(!("id" in args)) {
            this.set({id:nextUserId++});
        }
    },
    
    defaults: function() {
        var defaults = model.User.prototype.defaults.call(this);
        
        defaults["connected"] = 0;
        defaults["sockets"] = [];
        defaults["inEvent"] = false;
        return defaults;
    },
    
    connected: function(socket) {
        this.set({"connected":this.get("connected")+1});
        
        var sockets = this.get("sockets");
        sockets.push(socket);
        
        this.set({"sockets":sockets});
        this.trigger("connected");
    },
    
    disconnected: function(socket) {
        this.set({"connected":this.get("connected")-1});
        this.set({"sockets":_.without(this.get("sockets"), socket)});
        this.trigger("disconnected");
    },
    
    isInEvent: function() {
        if(this.get("inEvent")===false) return false;
        else return true;
    },
    
    toJSON: function() {
        var dict = model.User.prototype.toJSON.call(this);
        
        // Knock out transient attributes.
        delete dict["sockets"];
        delete dict["inEvent"];
        
        return dict;
    }
});

var nextEventId = 0;
server_model.ServerEvent = model.Event.extend({
    
    initialize: function(args) {
        model.Event.prototype.initialize.call(this, args);
        
        // Set and increment the post id.
        if(!("id" in args)) {
            this.set({id:nextEventId++});
        }
    },
    
    defaults: function() {
        var defaults = model.Event.prototype.defaults.call(this);
    
        defaults["posts"] = new server_model.ServerPostList();
        defaults["chat"] = new server_model.ServerChatList();
        defaults["users"] = new server_model.ServerUserList();
        
        return defaults;
    },
    
    addChat: function(chat) {
        this.get("chat").add(chat);
        
        modelIO.sockets.in(this.getChannel()).emit("chat",
            JSON.stringify(chat.toJSON()));
    },
    
    userJoined: function(user) {
        // Join this user's sockets to the event's channels;
        var sockets = user.get("sockets");
        
        _.invoke(_.values(sockets), 'join', this.getChannel());
        
        user.set({"inEvent":this.id});
        user.bind("disconnected", function() {this.userLeft(user)}, this);
        
        this.get("users").add(user);
    },
    
    userLeft: function(user) {
        var sockets = user.get("sockets");
        
        user.set({"inEvent":false});
        _.invoke(_.values(sockets), 'leave', this.getChannel());
        
        this.get("users").remove(user);
    },
    
    getChannel: function() {
        return "event." + this.id;
    }
});

server_model.ServerPostList = model.PostList.extend({
    // placeholder for now - the default collection is fine.
});

server_model.ServerChatList = model.ChatList.extend({
    // placeholder for now - the default collection is fine.
});

server_model.ServerEventList = Backbone.Collection.extend({
    // Placeholder.
});

server_model.ServerUserList = Backbone.Collection.extend({
    
    getConnectedUsers: function() {
        var connectedUsersList = [];
        
        this.each(function(user) {
            if(user.get("connected")>0) connectedUsersList.push(user);
        });
        return connectedUsersList;
    },
    
    numConnectedUsers: function() {
        return this.getConnectedUsers().length;
    },
    
    getUser: function(name, affiliation) {
        return this.find(function(user) {
            return user.get("name") == name &&
                   user.get("affiliation")==affiliation;
        });
    }
});

// We need this mostly for testing, so each test starts at id=0; 
server_model.resetIds = function() {
    nextUserId = 0;
    nextPostId = 0;
    nextEventId = 0;
};
