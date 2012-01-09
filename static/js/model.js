// This is include-able both in a browser environment and in a v8/node env,
// so it needs to figure out which situation it is in. If it's on the server,
// put everything in exports and behave like a module. If it's on the client,
// fake it and expect the client to understand how to deal with things.
(function () {
  var server = false,
    model;
  if (typeof exports !== 'undefined') {
    model = exports;
    server = true;
    
    _ = require('underscore');
    Backbone = require('backbone');
    
  } else {
    model = this.model = {};
  }


model.Post = Backbone.Model.extend({
    
    defaults: function() {
        return {
            fromName: "default name",
            fromAffiliation: "nowhere",
            fromId: -1,
            text: "default text",
            timestamp: new Date().getTime(),
            votes: [],
            promotedAt: null
        };
    },
    
    addVote: function(fromUserId, atTimestamp) {
        // console.log("incoming: " + atTimestamp + " / " + fromUser);
        if (_.isUndefined(atTimestamp) || _.isNull(atTimestamp)) {
            atTimestamp = Date.now();
        }
        
        if(_.isUndefined(fromUserId)) {
            fromUserId = null;
        }
        
        if(fromUserId instanceof model.User) {
            console.log("Tried to pass in a User object when addVote expects an id. Fixing the problem, but fix your code!");
            fromUserId = fromUserId.id;
        }
        
        // reject votes from the same person
        if(this.hasVoteFrom(fromUserId)) return false;
        
        var currentVoteList = this.get("votes");
        currentVoteList.push({"timestamp":atTimestamp, "id":fromUserId});
        this.set({
            "votes": currentVoteList
        });

        // TODO think about this - why is it here? this might be a vestige
        // of the old system. 
        this.trigger("change");
        return true;
    },
    
    votes: function() {
        return this.get("votes").length;
    },
    
    recentVotes: function(since) {
        if(_.isUndefined(since) || _.isNull(since)) {
            // If since isn't passed in, default to 2 minutes.
            since = 120*1000;
        }
        
        var numVoteInWindow = 0;
        var curTime = Date.now();
        
        
        var votesInWindow = _.filter(this.get("votes"), function(vote) {
            return (curTime - vote["timestamp"]) < since
        });
        
        return votesInWindow.length;
    },
    
    mostRecentVote: function() {
        var sortedVotes = _.sortBy(this.get("votes"), function(vote) {
            return vote["timestamp"];
        });
        sortedVotes.reverse();
        return sortedVotes[0];
    },
    
    hasVoteFrom: function(userId) {
        return _.find(this.get("votes"), function(vote) {
            return vote["id"]==userId;
        })!=null;
    },
    
    isPromoted: function() {
        return !(_.isNull(this.get("promotedAt")));
    }
});


model.User = Backbone.Model.extend({
    
    defaults: function() {
        return {
            name: "default name",
            affiliation: "default affiliation",
        };
    },
    
    // Leaving this here but not actually testing it yet. Validate is 
    // basically broken right now for my purposes. It isn't called on 
    // object construction, which is the majority of the times I would
    // actually want it to be used. It's only called on set() and save(),
    // the latter of which I never use because I'm not using that part of
    // backbone. There are a zillion issues in their bug tracker about this 
    // with no solution forthcoming yet.
    validate: function(attributes) {
        if("name" in attributes) {
            if(attributes.name.length > 30) {
                return "'" + attributes.name + "' is too long a name. It must be less than 30 characters.";
            }
            
            if(attributes.affiliation.length>30) {
                return "'" + attributes.affiliation + "' is too long an affiliation. It must be less than 30 characters.";
            }
        }
    }
});

model.Chat = Backbone.Model.extend({
    defaults: function() {
        return {
            fromName: "default",
            fromAffiliation: "default affiliation",
            fromId: -1,
            text: "default message",
            timestamp: new Date().getTime(),
            admin: false
        }
    },
});

model.PostList = Backbone.Collection.extend({
    // Placeholder.
});

model.ChatList = Backbone.Collection.extend({
    // Placeholder.
    // We might want this to be a moving window of a certain size, but
    // for now we'll just accumulate everything (e.g. leave this as a
    // default collection.)
});

model.Event = Backbone.Model.extend({
    initialize: function(args) {
        Backbone.Model.prototype.initialize.call(this, args);
        
        // These tests handle a situation where a client Event is inflated 
        // based on server data that has simple arrays in posts/chat fields
        // because Collections get JSON'd down to arrays. annoying, but this
        // will replace them with empty lists. If we end up with some fancier
        // serialization strategy later, will need to replace this.
        if(!(this.get("posts") instanceof model.PostList)) 
            this.set({"posts":this.defaults()["posts"]});
        if(!(this.get("chat") instanceof model.ChatList))
            this.set({"chat":this.defaults()["chat"]});
    },
    
    defaults: function() {
        return {
            title: "Default Event Title",
            posts: new model.PostList(),
            chat: new model.ChatList(),
            start: new Date().getTime()
        }
    },
    
    addChat: function(newChat) {
        this.get("chat").add(newChat);
    },
    
    addPost: function(newPost) {
        this.get("posts").add(newPost);
    },
});

})()