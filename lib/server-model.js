var _ = require('underscore')._
    Backbone = require('backbone'),
    model = require('../static/js/model.js'),
    crypto = require('crypto'),
    winston = require('winston'),
    dispatch = require('./dispatch.js'),
    sync = require('./redis-sync.js'),
    fs = require('fs');

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


// Add the proper backbone->redis sync method if we think we need it, 
// otherwise add one that does nothing so we can safely use .save 
// in cases where we should if we're syncing, without checking sync state
// every time.
Backbone.sync = sync.dummySync;
server_model.setPersist = function(shouldPersist) {
    if(shouldPersist) {
        Backbone.sync = sync.sync;
    } else {
        Backbone.sync = sync.dummySync;
    }
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
        
        user.joinToChannelForEvent(this.getChannel(), this.get("event"));
        
        // Now send the info for this post directly to this user.
        modelIO.sockets.in(user.getChannelForEvent(this.get("event"))).emit(
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
    },
});

var nextUserId=0;
server_model.ServerUser = model.User.extend({
    urlRoot: "user",
    
    initialize: function(args) {
        model.User.prototype.initialize.call(this, args);
        
        // Set and increment the post id.
        if(!("id" in args)) {
            var nextId = sync.getNextId(this);
            this.set({id:nextId});
        }
        // console.log("INIT USER");
    },
    
    defaults: function() {
        var defaults = model.User.prototype.defaults.call(this);
        
        defaults["connected"] = 0;
        defaults["sockets"] = [];
        
        defaults["events"] = {};
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
    
    joinedEventWithSocket: function(event, socket) {
        // console.log("joinedEventWithSocket: " + event.id + " s.id: " + socket.id);
        // add this event to the list of events we're in
        var events = this.get("events");

        if(!(event.id in events)) {
            events[event.id] = [];
        }
        
        events[event.id].push(socket);
        
        this.set({"events":events});
        
        // now that socket should start listening for user specific messages
        // for this event.
        socket.join(this.getChannelForEvent(event));
        
        socket.set("eventId", event.id);
        event.userJoined(this);
    },
    
    leftEventWithSocket: function(event, socket) {
        // console.log("leftEventWithSocket: " + event.id + " s.id: " + socket.id);

        var events = this.get("events");
        
        events[event.id] = _.without(events[event.id], socket);
        
        if(events[event.id].length==0)
            delete events[event.id];
        
        socket.leave(this.getChannelForEvent(event));
        
        this.set({"events":events});
        socket.set("eventId", null);
        event.userLeft(this);
    },
    
    isInEvent: function(event) {
        return this.isInEventId(event.id);
    },
    
    isInEventId: function(eventId) {
        return eventId in this.get("events");
    },
    
    joinToChannelForEvent: function(channel, event) {
        // console.log("joinToChanForEvent: " + channel + " (for event " + event.id+")");

        // console.log("(joining chan) events: " + _.keys(this.get("events")));
        if(!(event.id in this.get("events"))) {
            logger.warning("was asked to join to a channel for an event which this user is not in: "
                + channel + "; for event: " + event.id);
            return;
        }
        
        var sockets = this.get("events")[event.id];
        
        if(sockets.length > 0) {
            _.invoke(sockets, 'join', channel);
            // console.log("socketIds: " + _.pluck(sockets, "id"));
        } else {
            logger.warning("user thought it was in this event, but had no sockets for it: "
                + channel + "; for event: " + event.id);
        }
    },
    
    removeFromChannelForEvent: function(channel, event) {
        // console.log("removeFromChanForEvent: " + channel + " (for event " + event.id+")");
        // console.log("(leaving chan) events: " + _.keys(this.get("events")));

        if(!(event.id in this.get("events"))) {
            logger.warning("was asked to leave to a channel for an event which this user is not in: "
                + channel + "; for event: " + event.id);
            return;
        }
        
        var sockets = this.get("events")[event.id];
        
        if(sockets.length > 0) {
            _.invoke(sockets, 'leave', channel);
        } else {
            logger.warning("user thought it was in this event, but had no sockets for it: "
                + channel + "; for event: " + event.id);
        }
    },
    
    disconnectAllSockets: function() {
        _.invoke(this.get("sockets"), 'disconnect');
    },
    
    getChannel: function() {
        return "user." + this.id;
    },
    
    getChannelForEvent: function(event) {
        return this.getChannel() + "." + event.id;
    },
    
    toJSON: function() {
        var dict = model.User.prototype.toJSON.call(this);
        
        // Knock out transient attributes.
        delete dict["sockets"];
        delete dict["events"];
        delete dict["connected"];
        
        return dict;
    },
    
    url: function() {
        return this.urlRoot + "." + this.id;
    }
});

var nextEventId = 0;
server_model.ServerEvent = model.Event.extend({
    urlRoot: "event",
    
    initialize: function(args) {
        model.Event.prototype.initialize.call(this, args);
        
        // Set and increment the post id.
        if(!("id" in args)) {
            var nextId = sync.getNextId(this);
            this.set({id:nextId});
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
        
        user.joinToChannelForEvent(this.getChannel(), this);
        
        user.bind("disconnected", function() {this.userLeft(user)}, this);
        
        // publish all currently-promoted posts to users who join later.
        _.each(this.get("posts").getPromotedPosts(), function(post) {
            post.publishTo(user);
        });
        
        this.get("users").add(user);
    },
    
    userLeft: function(user) {
        
        user.set({"inEvent":false});
        user.removeFromChannelForEvent(this.getChannel(), this);
        
        this.get("users").remove(user);
    },
    
    getChannel: function() {
        return "event." + this.id;
    },
    
    toJSON: function() {
        var dict = model.Event.prototype.toJSON.call(this);
        
        // Knock out transient attributes.
        delete dict["dispatcher"];
        delete dict["users"];
        delete dict["posts"];
        delete dict["chat"];
        delete dict["dispatcher-options"];
        
        return dict;
    },
    
    url: function() {
        return this.urlRoot + "." + this.id;
    }
});

server_model.ServerPostList = model.PostList.extend({
    "model":model.ServerPost,
    
    // placeholder for now - the default collection is fine.
});

server_model.ServerChatList = model.ChatList.extend({
    // placeholder for now - the default collection is fine.
});

server_model.ServerEventList = Backbone.Collection.extend({
    "model":server_model.ServerEvent,
    
    url: function() {
        return "event";
    }
});

server_model.ServerUserList = Backbone.Collection.extend({
    "model":server_model.ServerUser,
    
    url: function() {
        return "user";
    },
    
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
    },
});

// We need this mostly for testing, so each test starts at id=0; 
server_model.resetIds = function() {
    nextUserId = 0;
    nextPostId = 0;
    nextEventId = 0;
    
    sync.flush();
};
