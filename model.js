var _ = require('underscore')._
    Backbone = require('backbone'),
    base_model = require('./static/js/backchannl-backbone.js'),
    logger = require('winston');
    
exports.ServerPost = base_model.Post.extend({
    initialize: function(params) {
        // call super
        base_model.Post.prototype.initialize.call(this, params);
        
        // setup listeners for particular change events that we're going to 
        // want to send to clients. 
        this.bind("changed", this.handleChanged, this);
        
        // now we're going to want to send a notice to all the clients
        // of this new post.
        io.sockets.emit("post.new", this.toJSON());
    },
    
    handleChanged: function() {
        // when a post is changed, this is called.
        logger.debug("Handling change on post object.");
    },
});


exports.ServerPostList = base_model.PostList.extend({
    
    initialize: function(params) {
        base_model.PostList.prototype.initialize.call(this, params);
        
        
        this.bind("add", function(post) {
            logger.debug("adding post to post list: ", post);
        });
        
        this.bind("remove", function(post) {
            logger.debug("removing post from post list: ", post);
        });
    },
    
    
});

// Make sure to call this first so the models here have access to socket
// in its initialized state.
var io = null;
exports.setIo = function(existingIo) {
    io = existingIo;
}