var _ = require('underscore'),
    model = require('./server-model.js'),
    fs = require('fs'),
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
        logger.error("Tried to make an action with no type: " + type);
        this.type = "INVALID_ACTION";
        return;
    }
    
    this.type = type;
}

actions.BaseAction.prototype = {
    type: null,
    handlers: null,
    results: {},
    
    execute: function() {
        var handler = this.handlers[this.type];

        if(handler!=null) return handler.call(this);
        else logger.error("Action of type " + this.type + " has no ActionType!");
        
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


actions.EventAction = function(type, user, event, params, results) {
    
    if(_.isUndefined(type) || _.isNull(type) || 
        (_.isUndefined(user) || _.isNull(user))) {
        logger.error("Tried to make an action with no type ("+type+") or no user (" + user + ")");
        this.type = "INVALID_ACTION";
        this.user = null;
        this.event = null;
        this.params = {};
        this.results = {};
        return;
    }
    
    if(_.isUndefined(params) || _.isNull(params)) params = {};
    if(_.isUndefined(results) || _.isNull(results)) results = {};

    
    this.type = type;
    this.user = user;
    this.event = event;
    this.params = params;
    this.results = results;
};

actions.EventAction.prototype = {};
_.extend(actions.EventAction.prototype, actions.BaseAction.prototype)
_.extend(actions.EventAction.prototype, {
    user: null,
    type: null,
    event: null,
    params: {},
    handlers: actions.EventActionHandlers,
    
    execute: function(silent) {
        var result = actions.BaseAction.prototype.execute.call(this);
        logger.debug("ACTION: " + this.type + " from " + this.user.id +
            " in event " + this.event.id);
        // console.log("writing action of type " + this.type + " params: " + JSON.stringify(this.params));
        
        if(_.isUndefined(silent)) {
            silent = false;
        }
        
        if((!silent) && actions.journalingEnabled) {
            var file = actions.getFileForEvent(this.event);
            fs.write(file, JSON.stringify(this) + "\n");
        }
        
        return result;
    },
    
    toJSON: function() {
        var dict = {}
        
        // write only userids and eventids, not the full objects.
        // we'll unswizzle those references when this object is
        // reinflated. 
        dict["type"] = this.type;
        dict["userId"] = this.user.id;
        dict["eventId"] = this.event.id;
        dict["params"] = this.params;
        dict["results"] = this.results;
        
        return dict;
    }
});


/****************************************************************************/
/*                      ACTION JOURNALING METHODS                           */
/****************************************************************************/
actions.baseEventsDir = "db/events/";
actions.journalingEnabled = true;
actions.server = null;

actions.files = {};
actions.getFileForEvent = function(event) {
    var file = null;
    if(event.id in actions.files) {
        file = actions.files[event.id];
    } else {
        file = fs.openSync(actions.baseEventsDir + event.id + ".act", 'a');
        actions.files[event.id] = file;
    }
    
    return file;
}

actions.flushAllJournals = function() {
    
    var files = _.filter(fs.readdirSync(actions.baseEventsDir), function(file) {
        if(file.indexOf(".act")!=-1) return true;
        else return false;
    });
    
    for(var index in files) {
        var file = files[index];
        fs.unlinkSync(actions.baseEventsDir + file);
    }
    
    actions.files = {};
}

actions.runJournaledActionsForEvent = function(event) {
    // TODO check if the file exists. 
    
    var file = fs.readFileSync(actions.baseEventsDir + event.id + ".act",
        'utf8').split("\n");

    // reinflate an action for each of line of the file.
    var events = [];
    for(var lineIndex in file) {
        var line = file[lineIndex];
        
        // last line is often empty
        if(line.length==0) break;
        
        var fields = JSON.parse(line);
        
        // we need a way to get at the global users list, because
        // 'users' on the event just tracks connected users and
        // on startup it's always going to be empty.
        var user = actions.server.allUsers.get(fields.userId);
        // console.log(JSON.stringify([fields.type, user, event, fields.params]));
        var action = new actions.EventAction(fields.type, user, event, fields.params, fields.results);
        
        // execute the actions silently so they don't regenerate new records.
        action.execute(true);
    }
}

/****************************************************************************/
/*                      EVENTACTION HANDLER METHODS                         */
/****************************************************************************/

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
    
    var setId;
    if("id" in this.results) {
        setId = this.results.id;
    }
    
    var newPost = new model.ServerPost({
        id: setId,
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
    
    this.results["id"] = newPost.id;
    
    this.event.addPost(newPost);
    
    // Add a vote from the post creator.
    newPost.addVote(this.user.id);
}

function voteHandler() {
    var post = this.event.get("posts").get(this.params.postId);
    
    return post.addVote(this.user.id);
}