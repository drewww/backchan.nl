var   model = require('./server-model.js')
    , _ = require('underscore')._
    , winston = require('winston')
    , Backbone = require('backbone');


var logger= new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            filename:'dispatch.log',
            timestamp:true,
            levels:winston.syslog,
            json:false,
            })
    ]
});

_.extend(model, require('../static/js/model.js'));

dispatch = exports;

// The BroadcastDispatcher is a really basic dispatcher that
// spreads posts by broadcasting them to everyone in the event immediately.
// There's no notion of promotion or anything here, all messages are basically
// insta-promoted. This works only in cases with very low post load. Low user
// count is probably also useful.
dispatch.BroadcastDispatcher = function() {
    
}

dispatch.BroadcastDispatcher.prototype = {
    
    
    
}

// SpreadingDispatcher is tricky dispatcher that follows a heuristic for 
// promoting posts. When a new post comes in, dispatch it to N people.
// Whenever we get a vote from those people, spread to another M people.
// On each vote, the dispatcher calculates a rank ordering of all the posts
// based on score. If a post is now in the top (8?) posts, promote it and
// publish it to everyone. 

dispatch.SpreadingDispatcher = function() {
    
}

dispatch.SpreadingDispatcher.prototype = {
    
    
    
    
    
}

// The base dispatcher object that other dispatchers extend. This just does
// the default bindings + object storage that specific dispatchers will 
// all need to do. Should be considered ABSTRACT and never instantiated!
dispatch.BaseDispatcher = function(event) {
    this.event = event;
    
    // Dispatchers need some event bindings to do their job:
    // - new post
    // - post vote
    //
    // We might at some point add in some other data:
    // - user joined
    // - user left
    // - chat message
    // - post ignored (if we add that feature)
    
    this.event.bind("post.new", this.newPost, this);
    this.event.bind("post.vote", this.postVote, this);
}

dispatch.BaseDispatcher.prototype = {
    
    event: null,
    
    newPost: function(post) {
        logger.debug("dispatch received notice of new post: " + JSON.stringify(post.toJSON()));
        
        this.trigger("post.new", post);
    },
    
    postVote: function(post, voter) {
        logger.debug("dispatch received notice of a vote: " + JSON.stringify(post.toJSON()) + " from: " + voter.get("name"));
        
        this.trigger("post.vote", post, voter);
    },
    
    promotePost: function(post) {
        // Promotion is mostly shared across dispatchers. The process is:
        // 1. publish to all users in the event
        // 2. set the promotion time on the post.

        post.set({"promotedAt":new Date().getTime()});
        
        this.event.get("users").each(function(user) {
            post.publishTo(user);
        });
    }
}

_.extend(dispatch.BaseDispatcher.prototype, Backbone.Events);