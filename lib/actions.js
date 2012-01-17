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

actions.BaseAction = function(type) {
    if(_.isUndefined(type) || _.isNull(type)) {
        logger.err("Tried to make an action with no type: " + type);
        this.type = "INVALID_ACTION";
        return;
    }
    
    this.type = type;
}

actions.BaseAction.prototype = {
    type: null,
    handlers: null,
    
    execute: function() {
        var handler = this.handlers[this.type];

        if(handler!=null) return handler.call(this);
        else logger.err("Action of type " + this.type + " has no ActionType!");
        
        return false;
    },
}

actions.EventActionHandlers = {
    "POST":postHandler,
    "VOTE":voteHandler,
    "CHAT":chatHandler
}

actions.ServerActionHandlers = {

};

actions.ServerAction = function(type, server, params) {

    if(_.isUndefined(type) || _.isNull(type) || 
        (_.isUndefined(server) || _.isNull(server))) {
        logger.err("Tried to make an action with no type ("+type+") or no server (" + server + ")");
        this.type = "INVALID_ACTION";
        this.server = null;
        this.params = {};
        return;
    }
    
    if(_.isUndefined(params) || _.isNull(params)) params = {};
    
    this.type = type;
    this.server = server;
    this.params = params;
}

actions.ServerAction.prototype = {};
_.extend(actions.ServerAction.prototype, actions.BaseAction.prototype)
_.extend(actions.ServerAction.prototype, {
    server: null,
    handlers: actions.ServerActionHandlers
});


actions.EventAction = function(type, user, event, params) {
    
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

actions.EventAction.prototype = {};
_.extend(actions.EventAction.prototype, actions.BaseAction.prototype)
_.extend(actions.EventAction.prototype, {
    user: null,
    type: null,
    params: {},
    handlers: actions.EventActionHandlers,
    
    execute: function() {
        return actions.BaseAction.prototype.execute.call(this);
    }
});



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

function newEventHandler() {
    
}

