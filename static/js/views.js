
// This file is never going to be run through mocha on the server because it
// depends on the DOM being present, which I don't really want to work out
// quite yet. So we're not going to do the on-server-or-not dance we do
// in client.js and model.js, since this is purely local. We assume that
// we have model and already loaded here.

// Here's the hierarchy:
// BackchannlBar    contains everything else; absolutely positioned on the 
//                  edge of the screen.
//
// ChatBarView      contains the chat entry text field, and is the parent of 
//                  two ChatListViews, one with transparent background + no
//                  scroll, one with an opaque background + scroll
//
// ChatMessageView  each individual chat message. Will also have instances of
//                  UserView within it.
//
// PostListView     flush with the left edge of the screen, contains the 
//                  posts header, a text field for entering new posts, and
//                  the scrollable list of current posts
//
// PostView         The view for each individual post. Has lots of features +
//                  events that we won't go into here. Has UserViews in it, 
//                  but that's about it. 


views = {};

views.PostView = Backbone.View.extend({
    tagName: 'div',
    
    template: _.template('<div class="post"></div>'),
    
    events: {
        
    },
    
    initialize: function() {
        this.model.bind('change', this.render, this);
        this.model.bind('destroy', this.remove, this);
    },
    
    render: function() {
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
    },
});

views.PostListView = Backbone.View.extend({
    
});

views.UserView = Backbone.View.extend({
    
});

views.ChatMessageView = Backbone.View.extend({
    
});

views.ChatListView = Backbone.View.extend({
    
});

views.ChatBarView = Backbone.View.extend({
    
});

views.BackchannlBar = Backbone.View.extend({
    
});