var _ = require('underscore')._
    Backbone = require('backbone'),
    base_model = require('./static/js/backchannl-backbone.js'),
    crypto = require('crypto'),
    logger = require('winston');

logger.cli();
logger.default.transports.console.timestamp = true;


var nextPostId=0;
exports.ServerPost = base_model.Post.extend({
    initialize: function(params) {
        // call super
        base_model.Post.prototype.initialize.call(this, params);

        // Set and increment the post id.
        this.set({id:nextPostId++});
        
        // setup listeners for particular change events that we're going to 
        // want to send to clients. 
        this.bind("changed", this.handleChanged, this);
        
        // now we're going to want to send a notice to all the clients
        // of this new post.
        io.sockets.emit("post.new", this.toJSON());
    },
    
    handleChanged: function() {
        // when a post is changed, this is called.
        logger.info("Handling change on post object.");
    },
    
    add_vote: function() {
        var timestamp = Date.now();
        base_model.Post.prototype.add_vote.call(this, timestamp);
        
        io.sockets.emit("post.vote", {id:this.id, "timestamp":timestamp});
    }
});


exports.ServerPostList = base_model.PostList.extend({
    
    initialize: function(params) {
        base_model.PostList.prototype.initialize.call(this, params);
        
        this.bind("add", function(post) {
            logger.info("adding post to post list");
        });
        
        this.bind("remove", function(post) {
            logger.info("removing post from post list");
        });
    },
    
    
});

var nextUserId = 0;
exports.ServerUser = Backbone.Model.extend({
    
    initialize: function(params) {
        Backbone.Model.prototype.initialize.call(this, params);
        
        this.set({id:nextUserId++});
    },
    
    defaults: function() {
        return {
            name: "default name",
            affiliation: "default affiliation",
            connected: false
        };
    },
    
});

exports.ServerUserList = Backbone.Collection.extend({
    
    
    get_connected_users: function() {
        var connectedUsersList = [];
        
        this.each(function(user) {
            if(user.get("connected")) connectedUsersList.push(user);
        });
        
        return connectedUsersList;
    },
    
    num_connected_users: function() {
        return this.get_connected_users().length;
    },
    
    get_user: function(name, affiliation) {
        var filteredList = this.find(function(user) {
            return user.get("name") == name &&
                   user.get("affiliation")==affiliation;
        });
        
        
    }
});

// Make sure to call this first so the models here have access to socket
// in its initialized state.
var io = null;
exports.setIo = function(existingIo) {
    io = existingIo;
}

