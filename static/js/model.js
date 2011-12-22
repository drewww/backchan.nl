(function () {
  var server = false,
    model;
  if (typeof exports !== 'undefined') {
    model = exports;
    server = true;
    
    _ = require('underscore');
    Backbone = require('backbone');
    
  } else {
      console.log("on client");
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
            votes: []
        };
    },
    
    addVote: function(atTimestamp, fromUser) {
        console.log("incoming: " + atTimestamp + " / " + fromUser);
        if (_.isUndefined(atTimestamp) || _.isNull(atTimestamp)) {
            atTimestamp = Date.now();
        }
        
        if(_.isUndefined(fromUser)) {
            fromUser = null;
        }
        
        console.log("adding vote: " + atTimestamp + " from user: " + fromUser);

        var currentVoteList = this.get("votes");
        currentVoteList.push({"timestamp":atTimestamp, "id":fromUser});
        this.set({
            "votes": currentVoteList
        });

        this.trigger("change");
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
        });
    }
});

})()