(function () {
  var server = false,
    Backchannl;
  if (typeof exports !== 'undefined') {
      console.log("on server");
    Backchannl = exports;
    server = true;
    
    _ = require('underscore');
    Backbone = require('backbone');
    
  } else {
      console.log("on client");
    Backchannl = this.Backchannl = {};
  }


Backchannl.Post = Backbone.Model.extend({

    add_vote: function(at_timestamp, from_user) {
        console.log("incoming: " + at_timestamp + " / " + from_user);
        if (_.isUndefined(at_timestamp) || _.isNull(at_timestamp)) {
            at_timestamp = Date.now();
        }
        
        if(_.isUndefined(from_user)) {
            from_user = null;
        }
        
        console.log("adding vote: " + at_timestamp + " from user: " + from_user);

        var currentVoteList = this.get("votes");
        currentVoteList.push({"timestamp":at_timestamp, "id":from_user});
        this.set({
            "votes": currentVoteList
        });

        this.trigger("change");
    },


    defaults: function() {
        return {
            from_name: "default name",
            from_affiliation: "nowhere",
            text: "default text",
            timestamp: Date.now(),
            votes: []
        };
    },
    
    votes: function() {
        return this.get("votes").length;
    },
    
    recent_votes: function(since) {
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
    
    has_vote_from: function(userId) {
        return _.find(this.get("votes"), function(vote) {
            return vote["id"]==userId;
        });
    }
    
});


Backchannl.PostView = Backbone.View.extend({

    tagName: 'div',

    template: _.template('<div class="post">\
    <div class="button-container">\
    <div class="vote-button">\
    	<%=votes.length%>\
    </div>\
    <div class="dismiss-button">\
    dismiss\
    </div>\
    </div>\
    <div class="text">\
        <%=text%>\
    </div>\
    <div class="footer">\
    <span class="byline">\
    <%= from_name %> / <%= from_affiliation %>\
    </span>\
    <span class="timestamp">\
    <%=((Date.now() - timestamp)/60000).toFixed(1)%> minutes old \
    </span>\
    </div>\
    <br class="clear">\
    </div>'),

    events: {
        "click .dismiss-button": "dismiss",
        "click .vote-button": "vote"
    },

    initialize: function() {
        this.model.bind('change', this.render, this);
        this.model.bind('destroy', this.remove, this);
    },

    render: function() {
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
    },

    dismiss: function() {
        this.model.trigger("dismiss", this.model);
    },

    vote: function() {
        socket.emit("post.vote", {"id":this.model.id});
        this.model.trigger("dismiss", this.model);
        this.render();
    }
});

Backchannl.PostList = Backbone.Collection.extend({

    model: Backchannl.Post,
    
    initialize: function(params) {
        Backbone.Collection.prototype.initialize.call(this, params);
        
        theCollection = this
        this.bind("add", function(p) {
            p.bind("change", function() {
                theCollection.sort({silent:true});
            });
        });
    },

    first: function() {
        return this.at(0);
    },
    
    comparator: function(post) {
        return -post.votes();
    }

});

Backchannl.NewPostList = Backchannl.PostList.extend({
    
    initialize: function() {
        this.bind("add", function (post){
            post.bind("dismiss", this.postDismissed, this);
        });
    },
    
    comparator: function(post) {
        return post.get("timestamp");
    },
    
    postDismissed: function(post) {
        
        // Now animate the current post out of the way.
        this.trigger("dismiss");
    }
});


Backchannl.PostListView = Backbone.View.extend({
    id: 'all',
    
    // template: _.template('')
    
    initialize: function() {
        
        console.log("initing POST LIST VIEW with collection: ", this.collection);

        this.collection.bind('add', this.render, this);
        this.collection.bind('remove', this.render, this);
        this.collection.bind('change', this.render, this);
        this.collection.bind('reset', this.render, this);
    },
    
    render: function() {
        // loop through each member of the collection and render them.
        $(this.el).html("");
        
        if(this.collection && this.collection.length > 0) {
            for(var index = 0; index<this.collection.length; index++) {
                var post = this.collection.at(index);
                
                var newView = new Backchannl.PostView({model:post});
                $(this.el).append(newView.render().el);
            }
        } else {
                $(this.el).append("<div class='empty-notice'>\
                there are no posts yet</div>");
        }
        
        return this;
    }
});

Backchannl.BasePostListView = Backbone.View.extend({
    // We may not need any here, not sure yet.
    events: {},
    curShownView: null,

    initialize: function() {
        this.collection.bind('add', this.render, this);
        this.collection.bind('remove', this.render, this);
    },

    render: function() {
        // get the current first item from the collection and display it.
        $(this.el).html(this.template());

        var currentDisplayedPost = this.collection.first();
        if (!_.isUndefined(currentDisplayedPost)) {
            this.curShownView = new Backchannl.PostView({
                model: currentDisplayedPost
            });
            $(this.el).append(this.curShownView.render().el);
        } else {
            $(this.el).append("<div class='empty-notice'>\
            there are no new posts right now</div>");
        }

        return this;
    }
});

Backchannl.NewPostListView = Backchannl.BasePostListView.extend({
    id: 'new',

    template: _.template('<h1>new</h1><div class="num-more"></div><div class="post-container"></div></div>'),
    
    initialize: function(params) {
        this.collection.bind("dismiss", this.postDismissed, this);
        this.collection.bind("add", this.postAdded, this);
    },
    
    render: function() {
        $(this.el).html(this.template());

        var targetEl = $(this.el).children(".post-container");
        
        if(this.collection.length == 0) {
            $(this.el).append("<div class='empty-notice'>\
            there are no new posts right now</div>");
            
            targetEl.css("top", -127);
        } else {
            // loop through all the items and put them in the list.
            
            // console.log("start index: " + (this.collection.length-1));
            
            for(var index = this.collection.length-1; index>=0; index--) {
                console.log("render index: " + index);
                targetEl.append(new Backchannl.PostView(
                    {model:this.collection.at(index)}).render().el);
            }
        }
        
        // Now set the position properly.
        targetEl.css("top", -127*(this.collection.length-1));
        
        // now update the num-more indicator.
        console.log("collection size: " + this.collection.length);
        if(this.collection.length==0) {
            $(this.el).children(".num-more").hide();
        } else if(this.collection.length==1) {
            $(this.el).children(".num-more").text("1 new post");
        } else {
            $(this.el).children(".num-more").text(this.collection.length
                + " new posts");
        }
        
        console.log("num-more", $(this.el).children(".num-more"));
        
        return this;
    },
    
    postAdded: function() {
        if(this.collection.length==1) {
            
            var targetEl = $(this.el).children(".post-container");
            targetEl.append(new Backchannl.PostView(
                {model:this.collection.at(0)}).render().el);
            
            targetEl.css("top", -127);
            targetEl.animate({top:0});
        } else {
            this.render();
        }
    },
    
    postDismissed: function() {
        
        
        var targetEl = $(this.el).children(".post-container");
        var curTop = parseInt(targetEl.css("top"));
        var theCollection = this.collection;
        var theView = this;
        targetEl.animate({top:curTop + 127}, 500, "linear", function() {
            theCollection.remove(theCollection.at(0));
            theView.render();
        });
        
        
        
        
        // var el = $(this.curShownView.el);
        // var theCollection = this.collection;
        // el.css("position", "relative");
        // el.animate({
        //     top:120
        // },500, "linear", function() {
        //     console.log("in post animation callback");
        //     theCollection.remove(theCollection.at(0));
        // });
        // 
        // if(this.collection.length > 1) {
        //     console.log("sliding in a new one");
        //     // queue up the next one.
        //     var viewForNext = new Backchannl.PostView(
        //         {model:this.collection.at(1)});
        //     
        //     viewForNext.render();
        //     $(viewForNext.el).css("top", -30);
        //     $(this.el).append(viewForNext.el);
        //     $(viewForNext.el).animate({top:0}, 500, "linear",  function() {
        //         $(this).remove();
        //     });
        // }
        // 
    }
});


Backchannl.HotPostListView = Backchannl.BasePostListView.extend({
    id: 'hot',

    template: _.template('<h1>hot</h1>'),
});

})()