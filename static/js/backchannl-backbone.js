var Post = Backbone.Model.extend({
    initialize: function() {
        console.log("initing post");
    },

    add_vote: function(at_timestamp) {
        if (_.isUndefined(at_timestamp) || _.isNull(at_timestamp)) {
            at_timestamp = Date.now();
        }

        var currentVoteList = this.get("votes");
        currentVoteList.push(at_timestamp);
        this.set({
            "votes": currentVoteList
        });

        console.log("Adding vote, total: " + this.get("votes").length);
    },


    defaults: function() {
        return {
            from_name: "default name",
            from_affiliation: "nowhere",
            text: "default text",
            timestamp: Date.now(),
            votes: [Date.now()]
        };
    }

});


var PostView = Backbone.View.extend({

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
    <%=timestamp%>\
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
        this.model.add_vote();
        this.render();
    }
});

var PostList = Backbone.Collection.extend({

    model: Post,

    first: function() {
        return this.at(0);
    },

    comparator: function(post) {
        return post.get("timestamp");
    }
});

var NewPostList = PostList.extend({
    
    initialize: function() {
        this.bind("add", function (post){
            post.bind("dismiss", this.postDismissed, this);
        });
    },
    
    postDismissed: function(post) {
        this.remove(post);
    }
});


var BasePostListView = Backbone.View.extend({
    tagName: 'div',

    // We may not need any here, not sure yet.
    events: {},

    initialize: function() {
        this.collection.bind('add', this.render, this);
        this.collection.bind('remove', this.render, this);
    },

    render: function() {
        // get the current first item from the collection and display it.
        $(this.el).html(this.template());

        var currentDisplayedPost = this.collection.first();
        if (!_.isUndefined(currentDisplayedPost)) {
            $(this.el).append(new PostView({
                model: currentDisplayedPost
            }).render().el);
        } else {
            $(this.el).append("<div class='empty-notice'>\
            there are no new posts right now</div>");
        }

        return this;
    }
});

var NewPostListView = BasePostListView.extend({
    id: 'new',

    template: _.template('<h1>new</h1>'),
});


var HotPostListView = BasePostListView.extend({
    tagName: 'div',
    id: 'hot',

    template: _.template('<h1>hot</h1>'),
});

