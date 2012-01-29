
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
views.conn = null;
views.CHAT_TIMEOUT = 10000;

views.PostView = Backbone.View.extend({
    className: 'post',
    template: _.template('<div class="contents"><span class="text"><%=text%></span>\
<span class="attribution">&nbsp;&nbsp;&mdash;<span class="name"><%=fromName%></span>, \
<span class="affiliation"><%=fromAffiliation%></span>, \
<abbr class="timeago" title="<%= new Date(timestamp).toISOString() %>"><%= new Date(timestamp).toTimeString()%></abbr>\
</span></div>\
<div class="footer">\
<div class="vote"><img src="/static/img/vote.png"><span class="voteCount"><%=voteCount%></span></div>\
<div class="comments"><img src="/static/img/comment.png">0</div>\
<div class="flag"><img src="/static/img/flag.png"></div>\
<br class="clear">\
</div>\
<div class="flag-options-container">\
<div class="flag-option">double</div>\
<div class="flag-option">inappropriate</div>\
<div class="flag-option">answered</div>\
<br class="clear">\
<div class="comments">\
</div>\
</div>\
'),
    
    events: {
        "click .vote":"vote",
        "click .comments":"expandComments",
        "click .flag":"toggleFlags",
    },
    
    flagsVisible: false,
    commentsVisible: false,
    
    initialize: function(params) {
        Backbone.View.prototype.initialize.call(this,params);
        
        this.model.bind('vote', this.renderVotes, this);
        this.model.bind('destroy', this.remove, this);
    },
    
    render: function() {
        console.log("rendering post");
        $(this.el).html(this.template(this.model.toJSON()));
        this.$(".flag-options-container").hide();
        
        this.$("abbr.timeago").timeago();
        return this;
    },
    
    renderVotes: function() {
        // I don't know if it's bad to do it this way but doing a full
        // render seemed to cause some flashing which was annoying. Not
        // so many ways something can change, so going to just update them
        // specifically.
        this.$(".voteCount").text(this.model.votes());
        return this;
    },
    
    vote: function() {
        views.conn.vote(this.model.id);
    },
    
    expandComments: function() {
        console.log("Expand comments");
    },
    
    toggleFlags: function() {
        if(this.flagsVisible) {
            this.$(".flag-options-container").slideUp(100);
        } else {
            this.$(".flag-options-container").slideDown(100);
        }
        this.flagsVisible = !this.flagsVisible;
    },
    
    setFlagsVisible: function(visible) {
        if(this.visible == this.flagsVisible) return;
        this.toggleFlags();
    },
});

views.PostListView = Backbone.View.extend({
    className: 'posts-list',
    template: _.template('\<div class="container">\
<div class="new-post">\
<h1>posts</h1>\
<form>\
<textarea class="post-input"></textarea>\
</form>\
</div>\
<div class="posts">\
</div>\
</div>\
'),

    events: {
        "submit form":"post",
        "click .post-input":"expandNewPost",
        "click button.submit":"post",
        "click button.cancel":"contractNewPost",
    },
    
    newPostExpanded: false,
    submitPostButton: null,
    cancelPostButton: null,
    
    initialize: function(params) {
        Backbone.View.prototype.initialize.call(this,params);

        views.conn.bind("state.JOINED", function() {
            this.collection = views.conn.event.get("posts");
            this.collection.bind('add', this.add, this);
            this.collection.bind('remove', this.remove, this);
        }, this);
        
        this.submitPostButton = $("<button class='submit'>Submit Post</button>");
        this.cancelPostButton = $("<button class='cancel'>Cancel Post</button>");
    },
    
    add: function(post) {
        var newView = new views.PostView({model:post});
        this.$(".posts").prepend(newView.render().el);
    },
    
    remove: function(post) {
        // this is a little tricky - gotta figure this out later.
    },
    
    post: function(event) {
        views.conn.post(this.$(".post-input").val());
        
        this.contractNewPost();
        event.preventDefault();
    },
    
    expandNewPost: function() {
        if(!this.newPostExpanded) {
            this.newPostExpanded = true;
            this.$(".post-input").addClass("expanded");
            this.$(".post-input").after(this.submitPostButton);
            this.$(".post-input").after(this.cancelPostButton);

            this.delegateEvents();
        }
    },
    
    contractNewPost: function() {
        if(this.newPostExpanded) {
            this.newPostExpanded = false;
            this.$(".post-input").removeClass("expanded");
            this.$(".post-input").val("");
            this.submitPostButton.remove();
            this.cancelPostButton.remove();
            
            this.delegateEvents();
        }
    },
    
    render: function() {
        $(this.el).html(this.template());
        
        if(this.collection && this.collection.length > 0) {
            this.collection.each(function(post) {
                var newView = new views.PostView({model:post});
                this.$(".posts").append(newView.render().el);
            });
        }
        
        return this;
    },
});



views.ChatView = Backbone.View.extend({
    className: 'message',
    template: _.template('<span class="name"><%=fromName%></span>\
<span class="affiliation"><%=fromAffiliation%></span>: \
<span class="text"><%=text%></span>'),
    
    
    render: function() {
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
    },
});

views.ChatListView = Backbone.View.extend({
    className: 'chats',
    fadeDelay: 10000,
    
    initialize: function(params) {
        Backbone.View.prototype.initialize.call(this,params);
        
        views.conn.bind("state.JOINED", function() {
            this.collection = views.conn.event.get("chat");
            this.collection.bind('add', this.add, this);
        }, this);
    },
    
    add: function(chat) {
        console.log("adding chat to view");
        // append to the el
        var newView = new views.ChatView({model:chat});
        $(this.el).append(newView.render().el);
        
        setTimeout(function() {
            $(newView.el).animate({
                opacity: 0.0
            }, 250, "linear", function() {
                $(newView).remove();
            });
        }, this.fadeDelay);
    },
    
    render: function() {
        console.log("Rendering ChatListView");
        $(this.el).html("");
        
        if(this.collection && this.collection.length > 0) {
            this.collection.each(function(chat) {
                var view = new views.ChatView({model:chat});
                var newMsgView = view.render().el;
                $(this.el).append(newMsgView);
            }, this);
        }
        
        return this;
    }
});

views.ChatBarView = Backbone.View.extend({
    id: "chat",
    template: _.template('<form class="chat-entry-form">\
    <input type="text" name="chat-input" title="say something!" value="" id="chat-input" autocomplete="off">\
    </form>'),
    
    events: {
        "submit .chat-entry-form":"chat"
    },
    
    chatListView: null,
    
    initialize: function() {
        this.chatListView = new views.ChatListView();
    },
    
    render: function() {
        $(this.el).html(this.template());
        
        // we don't need to force a render on this - it'll render itself
        $(this.el).append(this.chatListView.el);
        return this;
    },
    
    chat: function(event) {
        
        // grab the text, send it to the server, and clear the field
        var text = this.$("#chat-input").val();
        
        this.$("#chat-input").val("");
        
        conn.chat(text);
        
        event.preventDefault();
    }
});

views.BackchannlBarView = Backbone.View.extend({
    id: "backchannl-app",
    template: _.template('<div id="container"></div><div id="bar"></div>'),
    
    chat: null,
    posts: null,
    login: null,
    
    initialize: function(conn) {
        views.conn = conn;
        
        this.chat = new views.ChatBarView();
        this.posts = new views.PostListView();
        this.login = new views.LoginDialogView();
        
        views.conn.bind("state.JOINED", function() {
            console.log("switching to joined");
            // when we go to joined, hide the container
            this.$("#container").hide();
            this.render();
        }, this);
    },
    
    render: function() {
        $(this.el).html(this.template());

        if(views.conn.state == "JOINED") {
            this.$("#bar").append(this.posts.render().el);
            this.$("#bar").append(this.chat.render().el);
        } else {
            this.$("#container").append(this.login.render().el);
        }
        
        return this;
    },
});

views.LoginDialogView = Backbone.View.extend({
    id: "login",
    template: _.template('<h1>welcome to backchan.nl!</h1>\
<table>\
<tr><td class="label">name</td><td class="field"><input id="name" type="text"></td></tr>\
<tr><td class="label">affiliation</td><td class="field"><input id="affiliation" type="text"></td></tr>\
<tr><td></td><td><button class="login">Login</button></td></tr>\
</table><div class="status"></div>'),
    
    events: {
        "click .login":"login"
    },
    
    statusMessage: "",
    
    initialize: function() {
        // this is where we'll check local storage
        views.conn.bind("state.IDENTIFIED", function() {
            // I guess we're letting the parent class dismiss this for us?
        });
        
        views.conn.bind("message.identity-err", function(err) {
            console.log("Got an identity error message: " + err);
            // eventually expose this to the UI
        });
        
        views.conn.bind("state.IDENTIFIED", function() {
            views.conn.join(0);
        });
    },
    
    login: function() {
        // TODO we should add some validation here.
        var name = this.$("#name").val();
        var affiliation = this.$("#affiliation").val();
        
        // disable the entries and then say "logging in...";
        this.$("input").attr("disabled", true);
        
        // delay this a little in case the server responds immediately
        // and we can just avoid showing it at all. but if there are
        // connection/latency issues it's good to have something appear.
        var that = this;
        setTimeout(function() {
            that.setStatus("logging in...");
        }, 100);
        
        views.conn.identify(name, affiliation);
    },
    
    render: function() {
        $(this.el).html(this.template());
        this.setStatus(this.statusMessage);
        return this;
    },
    
    setStatus: function(msg) {
        this.statusMessage = msg;
        
        this.$(".status").text(msg);
        if(this.statusMessage == "") {
            this.$(".status").slideUp(100);
        } else {
            this.$(".status").slideDown(100);
        }
    },
});