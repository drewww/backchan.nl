var _ = require('underscore'),
    model = require('./server-model.js'),
    winston = require('winston');
    
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


actions = exports;


// Here we'll define a simple action class and a series of actions that 
// extend that class. 

actions.Action = function(type, user, event, params) {
    
    if(_.isUndefined(type) || _.isNull(type) || 
        (_.isUndefined(user) || _.isNull(user))) {
        logger.err("Tried to make an action with no type ("+type+") or no user (" + user + ")");
        this.type = "INVALID_ACTION";
        this.user = null;
        this.event = null;
        this.params = {};
        return;
    }
    
    if(_.isUndefined(params) || _.isNull(params)) params = {};
    
    this.type = type;
    this.user = user;
    this.event = event;
    this.params = params;
};

actions.Action.prototype = {
    user: null,
    type: null,
    params: {},
    results: {},
    
    execute: function() {
        var handler = actions.ActionHandlers[this.type];
        
        if(handler!=null) return handler.call(this);
        else logger.err("Action of type " + this.type + " has no ActionType!");
        
        return false;
    },
    
    addResult: function(key, value) {
        this.results[key] = value;
    }
    
};

actions.ActionHandlers = {
    "POST":postHandler,
    "VOTE":voteHandler,
    "CHAT":chatHandler
}

function chatHandler() {
    var newChat = new model.Chat({
        fromName: this.user.get("name"),
        fromAffiliation: this.user.get("affiliation"),
        fromId: this.user.id,
        text: this.params["text"],
        timestamp: new Date().getTime(),
        admin: false
    });
    
    // Now add that chat message to the event object.
    this.event.addChat(newChat);
}

function postHandler() {
    var newPost = new model.ServerPost({
        fromName: this.user.get("name"),
        fromAffiliation: this.user.get("affiliation"),
        fromId: this.user.id,
        text: this.params["text"],
        timestamp: new Date().getTime(),
        "event": this.event
    });

    // Publish the post to its creator so they can follow
    // its progress.
    newPost.publishTo(this.user);
    
    this.event.addPost(newPost);
    
    // Add a vote from the post creator.
    newPost.addVote(this.user.id);
}

function voteHandler() {
    return this.params.post.addVote(this.user.id);
}

