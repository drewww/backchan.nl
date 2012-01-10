var _ = require('underscore')._
    Backbone = require('backbone'),
    model = require('../static/js/model.js'),
    crypto = require('crypto'),
    winston = require('winston'),
    dispatch = require('./dispatch.js');

// rename exports just for clarity.
server_model = exports;

var logger= new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            filename:'server.log',
            timestamp:true,
            json:false,
            level: 'debug'
            })
    ],
    levels: winston.config.syslog.levels
});


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
        
        this.bind("change:promotedAt", this.promoted);
    },
    
    getChannel: function() {
        return "post." + this.id;
    },
    
    publishTo: function(user) {
        var usersSubscribed = this.get("usersSubscribed");
        
        if(usersSubscribed.include(user)) {
            return false;
        }
        
        // otherwise, subscribe this user.
        usersSubscribed.add(user);
        
        user.joinToChannel(this.getChannel());
        
        // Now send the info for this post directly to this user.
        modelIO.sockets.in(user.getChannel()).emit(
            "post", JSON.stringify(this.toJSON()));
    },
    
    addVote: function(fromUserId) {
        var result = model.Post.prototype.addVote.call(this, fromUserId, undefined, true);
        
        if(fromUserId instanceof server_model.ServerUser) {
            console.log("Tried to pass in a User object when addVote expects an id. Fixing the problem, but fix your code!");
            fromUserId = user.id;
        }
        
        if(result) {
            // If the add worked, send a post event to subscribed users.
            modelIO.sockets.in(this.getChannel()).emit("vote",
                {"postId":this.id, "fromUserId":fromUserId});
                
            this.trigger("vote", this, fromUserId);
                
            return true;
        } else {
            return false;
        }
    },
    
    promote: function(promotedAt) {
        model.Post.prototype.promote.call(this, promotedAt);
        
        this.get("event").get("users").each(function(user) {
            this.publishTo(user);
        }, this);
    },
    
    promoted: function() {
        
        if(this.previous("promotedAt")==null && this.get("promotedAt")!=null){
            // This method is called when someone (the dispatcher, basically)
            // updates this post's promotion state. When this happens, trigger
            // a 'promoted' message. This should only go to people subscribed
            // BEFORE the promotion (which means the post goes to everyone),
            // so it's important to set the promoted time before publishing
            // the post to everyone.
            modelIO.sockets.in(this.getChannel()).emit("promoted",
                {"postId":this.id, "promotedAt":this.get("promotedAt")});
        } else {
            // This shouldn't happen - promotedAt should be set once 
            logger.warning("Promoted event triggered in a weird situation.");
        }
    },
    
    defaults: function() {
        var defaults = model.Post.prototype.defaults.call(this);
        
        defaults["usersSubscribed"] = new server_model.ServerUserList();
        
        return defaults;
    },
    
    toJSON: function() {
        var dict = model.Post.prototype.toJSON.call(this);
        
        // Knock out transient attributes.
        delete dict["usersSubscribed"];
        delete dict["event"];
        
        return dict;
    }

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
        
        // Join the socket to the user-specific channel.
        socket.join(this.getChannel());
    },
    
    disconnected: function(socket) {
        
        socket.leave(this.getChannel());
        
        this.set({"connected":this.get("connected")-1});
        this.set({"sockets":_.without(this.get("sockets"), socket)});
        this.trigger("disconnected");
    },
    
    isInEvent: function() {
        if(this.get("inEvent")===false) return false;
        else return true;
    },
    
    joinToChannel: function(channel) {
        var sockets = this.get("sockets");
        _.invoke(_.values(sockets), 'join', channel);
    },
    
    removeFromChannel: function(channel) {
        var sockets = this.get("sockets");
        _.invoke(_.values(sockets), 'leave', channel);
    },
    
    disconnectAllSockets: function() {
        _.invoke(this.get("sockets"), 'disconnect');
    },
    
    getChannel: function() {
        return "user." + this.id;
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
        
        if("dispatcher" in args) {
            var dispatcher = dispatch.getDispatcherForName(this.get("dispatcher"));
            this.set({"dispatcher":new dispatcher(this,
                this.get("dispatcher-options"))});
        }
    },
    
    defaults: function() {
        var defaults = model.Event.prototype.defaults.call(this);
    
        defaults["posts"] = new server_model.ServerPostList();
        defaults["chat"] = new server_model.ServerChatList();
        defaults["users"] = new server_model.ServerUserList();
        
        defaults["dispatcher-options"] = {};
        
        return defaults;
    },
    
    addChat: function(chat) {
        model.Event.prototype.addChat.call(this, chat);
        
        modelIO.sockets.in(this.getChannel()).emit("chat",
            JSON.stringify(chat.toJSON()));
    },
    
    addPost: function(post) {
        model.Event.prototype.addPost.call(this, post);
        
        // Sending posts to clients is handled by dispatchers, so we're
        // not doing that here (like we do with chat, where everyone in
        // the event sees the same thing)
        //
        // We do, however, want to bind to this post to get notices about
        // votes on it that we can mirror to the dispatcher.
        post.bind("vote", this.postVotedOn, this);
        
        this.trigger("post.new", post);
    },
    
    postVotedOn: function(post, voterId) {
        var voter = this.get("users").get(voterId);
        
        if(_.isUndefined(voter) || _.isNull(voter)) {
            logger.warning("Received a notice of a vote from a user who is not connected to the event.");
            return;
        }
        
        this.trigger("post.vote", post, voter);
    },
    
    userJoined: function(user) {
        // Join this user's sockets to the event's channels
        
        user.joinToChannel(this.getChannel());
        
        user.set({"inEvent":this.id});
        user.bind("disconnected", function() {this.userLeft(user)}, this);
        
        this.get("users").add(user);
    },
    
    userLeft: function(user) {
        
        user.set({"inEvent":false});
        user.removeFromChannel(this.getChannel());
        
        this.get("users").remove(user);
    },
    
    getChannel: function() {
        return "event." + this.id;
    },
    
    toJSON: function() {
        var dict = model.Event.prototype.toJSON.call(this);
        
        // Knock out transient attributes.
        delete dict["dispatcher"];
        
        return dict;
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
