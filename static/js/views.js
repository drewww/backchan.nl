
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
        
        if(this.model.hasVoteFrom(views.conn.user.id)) {
            this.$(".vote img").attr("src", "/static/img/vote_pressed.png");
        } else {
            this.$(".vote img").attr("src", "/static/img/vote.png");
        }
        
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
<h1>POSTS</h1>\
<form>\
<textarea class="post-input">write a post!</textarea>\
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
            this.$(".post-input").val("");
            
            this.newPostExpanded = true;
            this.$(".post-input").addClass("expanded", 250);
            this.$(".posts").addClass("expanded", 250);

            this.$(".post-input").after(this.submitPostButton);
            this.$(".post-input").after(this.cancelPostButton);
            
            this.delegateEvents();
            
        }
    },
    
    contractNewPost: function() {
        if(this.newPostExpanded) {
            this.newPostExpanded = false;
            this.$(".post-input").val("write a post!");
            this.$(".post-input").removeClass("expanded", 250);
            this.$(".posts").removeClass("expanded", 250);

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
    template: _.template('<span class="time">(<%=timeString%>)</span>\
<span class="name"><%=fromShortName%></span>\
<span class="affiliation"><%=fromAffiliation%></span>: \
<span class="text"><%=text%></span>'),
    
    
    render: function() {
        var dict = this.model.toJSON();
        
        // THIS IS A REALLY AWFUL WAY TO DO THIS BUT I'M ON A PLANE AND 
        // DON'T HAVE JS TIME MANIP DOCS WITH ME
        // TODO make this use strftime or whatever it is.
        var times = new Date(this.model.get("timestamp")).toTimeString().split(":");
        dict["timeString"] = times[0] + ":" + times[1];
        
        // this is sort of a silly bit of handwaving but I guess it's okay?
        dict["fromShortName"] = new model.User({name: this.model.get("fromName"),
            affiliation: this.model.get("fromAffiliation")}).getShortName();
        
        $(this.el).html(this.template(dict));
        return this;
    },
});

views.ChatListView = Backbone.View.extend({
    template: _.template('<div class="header"><h1>CHAT</h1></div><div class="container"></div>'),
    
    className: 'chats',
    fadeDelay: 10000,
    mode: "live", // other option is "history"
    
    initialize: function(params) {
        Backbone.View.prototype.initialize.call(this,params);

        if("mode" in params) {
            if(params.mode=="history" || params.mode=="live") {
                if(params.mode=="history") {
                    $(this.el).addClass("history");
                    this.mode = "history";
                } else {
                    $(this.el).addClass("live");
                    this.mode = "live";
                }
            }
        }
        
        views.conn.bind("state.JOINED", function() {
            this.collection = views.conn.event.get("chat");
            this.collection.bind('add', this.add, this);
        }, this);
    },
    
    add: function(chat) {
        // append to the el
        var newView = new views.ChatView({model:chat});
        
        this.$(".container").append(newView.render().el);
        
        if(this.mode=="live") {
            setTimeout(function() {
                $(newView.el).animate({
                    opacity: 0.0
                }, 250, "linear", function() {
                    $(newView.el).remove();
                });
            }, this.fadeDelay);
        } else if (this.mode=="history") {
            // Scroll chat history down to the bottom.
            // INT_MAX. I want this to really represent the current height,
            // but I can't seem to find a property that represents the size 
            // that it really wants to be if there were no scrollbars to 
            // figure out how far down to push it. 
            this.$(".container").scrollTop(Math.pow(2, 30));
        }
    },
    
    render: function() {
        $(this.el).html(this.template());
        
        if(this.collection && this.collection.length > 0) {
            this.collection.each(function(chat) {
                var view = new views.ChatView({model:chat});
                var newMsgView = view.render().el;
                this.$(".container").append(newMsgView);
            }, this);
        }
        
        return this;
    },
});

views.ChatBarView = Backbone.View.extend({
    id: "chat",
    template: _.template('<div id="sendChat">CHAT</div><form class="chat-entry-form">\
    <input type="text" name="chat-input" title="say something!" value="" id="chat-input" autocomplete="off">\
    </form><div id="toggle-history" class=""></div>'),
    
    events: {
        "submit .chat-entry-form":"chat",
        "click #sendChat":"chat",
        "click #toggle-history":"toggleHistory"
    },
    
    chatListView: null,
    historyChatListView: null,
    historyVisible: false,
    
    initialize: function() {
        this.chatListView = new views.ChatListView({mode:"live"});
    },
    
    render: function() {
        $(this.el).html(this.template());
        
        $(this.el).append(this.chatListView.render().el);

        return this;
    },
    
    chat: function(event) {
        
        // grab the text, send it to the server, and clear the field
        var text = this.$("#chat-input").val();
        
        // ignore empty messages
        if(text.length > 0) {
            this.$("#chat-input").val("");
            conn.chat(text);
        }
        
        event.preventDefault();
    },
    
    toggleHistory: function() {
        // we have to cheat a little here - this view actually lives in the
        // container, not in the bar. this is necessary for z-index-control 
        // reasons. So we'll trigger a toggle-history event here and let
        // the bar handle this.
        
        if(!this.historyVisible) {
            $(this.chatListView.el).hide();
        } else {
            $(this.chatListView.el).show();
        }
        
        this.trigger("toggle-history");
        this.historyVisible = !this.historyVisible;
        
        if(this.historyVisible) {
            $("#toggle-history").addClass("pressed");
        } else {
            $("#toggle-history").removeClass("pressed");
        }
    }
});

views.BackchannlBarView = Backbone.View.extend({
    id: "backchannl-app",
    template: _.template('<div id="container"><img id="stream"\
src="/static/img/stream.png"></div><div id="bar">\
<div id="logo">backchan.nl</div></div>'),
    
    chat: null,
    posts: null,
    login: null,
    user: null,
    
    chatHistory: null,
    historyExtended: false,
    // events: {
    //     "click #identity":"showLoginDialog",
    // },
    
    initialize: function(conn) {
        views.conn = conn;
        
        this.chat = new views.ChatBarView();
        this.posts = new views.PostListView();
        this.login = new views.LoginDialogView();
        this.user = new views.UsernameView();
        
        this.chatHistory = new views.ChatListView({mode:"history"});
        this.chat.bind("toggle-history", function() {
            console.log("toggling history in bar");
            
            if(!this.historyExtended) {
                console.log("SHRINKING CHAT / EXPANDING STREAM");
                $("#toggle-history").removeClass("pressed");
                $("#stream").addClass("shrunk", 250);


                $(this.chatHistory.el).animate({
                    top: "0%",
                    bottom: 40
                }, 250);

                
            } else {
                console.log("EXPANDING CHAT / SHRINKING STREAM");
                $("#toggle-history").addClass("pressed");
                $("#stream").removeClass("shrunk", 250);

                $(this.chatHistory.el).animate({
                    top: "100%",
                    bottom: -40
                }, 250);

            }
            this.historyExtended = !this.historyExtended;
        }, this);
        
        views.conn.bind("state.JOINED", function() {
            console.log("switching to joined");
            // when we go to joined, hide the container
            var that = this;
            this.$("#login").fadeOut(500, function() {
                that.render.call(that);
            });
        }, this);
    },
    
    render: function() {
        $(this.el).html(this.template());
        
        this.$("#container").append(this.user.render().el);
        this.$("#container").append(this.chatHistory.render().el);
        
        if(views.conn.state == "JOINED") {
            this.$("#bar").append(this.posts.render().el);
            this.$("#bar").append(this.chat.render().el);
        }
        
        this.$("#container").append(this.login.render().el);
        
        this.delegateEvents();
        return this;
    },
    
    showLoginDialog: function() {
        this.$("#login").show();
        this.login.prepare();
    },
});

views.UsernameView = Backbone.View.extend({
    id: "identity",
    template: _.template('<h1><%=name%></h1><h2><%=affiliation%></h2>'),
    
    initialize: function(args) {
        Backbone.View.prototype.initialize.call(args, this);
        
        views.conn.bind("state.IDENTIFIED", function() {
            this.model = views.conn.user;
            this.render();
        }, this);
    },
    
    render: function() {
        if(!_.isUndefined(this.model)) {
            $(this.el).html(this.template(this.model.toJSON()));
        } else {
            $(this.el).html(this.template({name:"", affiliation:""}));
        }
        return this;
    },
});

views.LoginDialogView = Backbone.View.extend({
    id: "login",
    template: _.template('<h1>welcome to backchan.nl!</h1>\
<table>\
<tr><td class="label">name</td><td class="field"><input id="name" type="text" value="<%=name%>"></td></tr>\
<tr><td class="label">affiliation</td><td class="field"><input id="affiliation" type="text" value="<%=affiliation%>"></td></tr>\
<tr><td></td><td><button class="login">Login</button></td></tr>\
</table><div class="status"></div>'),
    
    events: {
        "click .login":"login"
    },
    
    statusMessage: "",
    name: "",
    affiliation: "",
    
    initialize: function() {
        if("name" in localStorage && "affiliation" in localStorage) {
            this.name = localStorage["name"];
            this.affiliation = localStorage["affiliation"];
        }
        
        views.conn.bind("state.IDENTIFIED", function() {
            // I guess we're letting the parent class dismiss this for us?
        });
        
        views.conn.bind("message.identity-err", function(err) {
            console.log("Got an identity error message: " + err);
            // eventually expose this to the UI
        });
        
        views.conn.bind("message.identity-ok", function() {
            this.setStatus("");
            
            if(views.conn.event==null) {
                views.conn.join(0);
            }
        }, this);
        
        views.conn.bind("state.CONNECTED", function() {
            if("name" in localStorage && "affiliation" in localStorage) {
                views.conn.identify(localStorage["name"],
                    localStorage["affiliation"]);
            }
        });
    },
    
    login: function() {
        // TODO we should add some validation here.
        var name = this.$("#name").val();
        var affiliation = this.$("#affiliation").val();
        
        
        // write it into localstorage
        localStorage["name"] = name;
        localStorage["affiliation"] = affiliation;
        
        // disable the entries and then say "logging in...";
        this.$("input").attr("disabled", true);
        
        // delay this a little in case the server responds immediately
        // and we can just avoid showing it at all. but if there are
        // connection/latency issues it's good to have something appear.
        var that = this;
        setTimeout(function() {
            that.setStatus("logging in...");
        }, 500);
        
        views.conn.identify(name, affiliation);
    },
    
    render: function() {
        $(this.el).html(this.template({name:this.name,
            affiliation: this.affiliation}));
        this.setStatus(this.statusMessage);
        return this;
    },
    
    prepare: function() {
        this.$("#name").text(views.conn.user.get("name"));
        this.$("#affiliation").text(views.conn.user.get("affiliation"));
        
        $('input').removeAttr("disabled");
        
        this.delegateEvents();
        this.setStatus("");
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