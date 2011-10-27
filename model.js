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

        this.set({id:nextPostId++});
        logger.info("id: " + this.id);
        
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

// Make sure to call this first so the models here have access to socket
// in its initialized state.
var io = null;
exports.setIo = function(existingIo) {
    io = existingIo;
}