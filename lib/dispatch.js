var   model = require('./server-model.js')
    , _ = require('underscore')._
    , winston = require('winston')
    , Backbone = require('backbone');


var logger= new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            filename:'dispatch.log',
            timestamp:true,
            json:false,
            level: 'debug'
            })
    ],
    levels: winston.config.syslog.levels
});

_.extend(model, require('../static/js/model.js'));

dispatch = exports;

dispatch.getDispatcherForName = function(name) {
    switch(name) {
        default:
        case "base":
            return dispatch.BaseDispatcher;
        case "spread":
            return dispatch.SpreadingDispatcher;
        case "broadcast":
            return dispatch.BroadcastDispatcher;
    }
}

// The base dispatcher object that other dispatchers extend. This just does
// the default bindings + object storage that specific dispatchers will 
// all need to do. Should be considered ABSTRACT and never instantiated!
dispatch.BaseDispatcher = function(event) {
    logger.debug("constructing a BASE DISPATCHER");
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
        if(_.isUndefined(this.event) || _.isNull(this.event)) {
            logger.error("Cannot promote a post if the event was not set.");
            return;
        }
        
        logger.info("Promoting post id:" + post.id);
        
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

// The BroadcastDispatcher is a really basic dispatcher that
// spreads posts by broadcasting them to everyone in the event immediately.
// There's no notion of promotion or anything here, all messages are basically
// insta-promoted. This works only in cases with very low post load. Low user
// count is probably also useful.
dispatch.BroadcastDispatcher = function(event) {
    logger.debug("constructing a BROADCAST DISPATCHER");
    
    this.event = event;
    this.event.bind("post.new", this.newPost, this);
}

dispatch.BroadcastDispatcher.prototype = {};
_.extend(dispatch.BroadcastDispatcher.prototype, dispatch.BaseDispatcher.prototype);
_.extend(dispatch.BroadcastDispatcher.prototype, {
    newPost: function(post) {
        logger.debug("got a new post notice in broadcast dispatcher");
        // insta promote it
        this.promotePost(post);
    }
});



// SpreadingDispatcher is tricky dispatcher that follows a heuristic for 
// promoting posts. When a new post comes in, dispatch it to N people.
// Whenever we get a vote from those people, spread to another M people.
// On each vote, the dispatcher calculates a rank ordering of all the posts
// based on score. If a post is now in the top (8?) posts, promote it and
// publish it to everyone. 

dispatch.SpreadingDispatcher = function(event, options) {
    if(_.isUndefined(options)) options = {};
    
    _.defaults(options, {
        "starting-spread": 2,
        "on-vote-spread": 1,
        "promotion-window": 6
    });
    
    this.event = event;
    this.event.bind("post.new", this.newPost, this);
    this.event.bind("post.vote", this.postVote, this);
    
    this.options = options;
}

dispatch.SpreadingDispatcher.prototype = {};
_.extend(dispatch.SpreadingDispatcher.prototype, dispatch.BaseDispatcher.prototype);
_.extend(dispatch.SpreadingDispatcher.prototype, {
    
    newPost: function(post) {
        // Promote it to starting-spread people.
        // Pick random people who aren't already on the list.
        var usersToSpreadTo = 
            this.getRandomUnsubscribedUsersFromPost(
                this.options["starting-spread"], post);
        
        _.each(usersToSpreadTo, function(user) {
            post.publishTo(user);
        }, this);
    },
    
    postVote: function(post, voter) {
        // Check and see if we want to promote the post. If we do, don't
        // then do a spread according to the on-vote-spread factor. 
        
        // Our first pass promotion metric is going to be a post rank
        // greater than a cutoff value: promotion-window.
        
        if(this.event.get("posts").getPostRank(post) <
            this.options["promotion-window"]) {
            this.promotePost(post);
        } else {
            // we actually don't want to spread on the first vote because
            // it's from the post creator. On newpost, we spread anyway,
            // so no reason to double it up.
            if(post.mostRecentVote().id===post.get("fromId")) return;
            
            // Spread to on-vote-spread number of people.
            var usersToSpreadTo = 
                this.getRandomUnsubscribedUsersFromPost(
                    this.options["on-vote-spread"], post);
            
            _.each(usersToSpreadTo, function(user) {
                // console.log("spreading to user: " + user.id)
                post.publishTo(user);
            }, this);
        }
    },
    
    getRandomUnsubscribedUsersFromPost: function(numUsers, post) {
        // get the list of all users from the event.
        // subtract users listed by the post as subscribed to this
        // post already.

        // TODO fix this - it's not properly removing people from the list
        var allUsers = this.event.get("users").toArray();
        var usersCurrentlySubscribed = post.get("usersSubscribed").toArray();
        
        for(var index in usersCurrentlySubscribed) {
            var loc = allUsers.indexOf(usersCurrentlySubscribed[index]);
            if(loc!=-1) {
                allUsers.splice(loc, 1);
            }
        }
        
        var validUsers = allUsers;
        
        // this handles the case where there are no users left to spread to
        if(validUsers.length==0) return [];
        
        var selectedUsers = [];
        // now pick new users
        
        
        for(var i=0; i<numUsers; i++) {
            var randomIndex = Math.floor(Math.random() * validUsers.length-0);
            
            selectedUsers.push(validUsers[randomIndex]);
            
            // Knock out the removed user so we don't double-select it.
            validUsers.splice(randomIndex, 1);
        }
        
        // TODO Need to do something smart about handling the situation where
        // there's nothing to spread to. I guess handle it outside this
        // function and just return null?
        
        return selectedUsers;
    }
});


