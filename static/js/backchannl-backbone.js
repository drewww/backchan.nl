var Post = Backbone.Model.extend({
    initialize: function() {
        console.log("initing post");
    },
    
    defaults: {
        from_name: "default name",
        from_affiliation: "nowhere",
        text: "default text",
        timestamp: Date.now(),
        votes: [Date.now()]
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
    
    events: {},
    
    initialize: function() {
        this.model.bind('change', this.render, this);
        this.model.bind('destroy', this.remove, this);
    },
    
    render: function() {
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
    },
    
    dismiss: function() {
        console.log("dismiss");
    },
    
    vote: function() {
        console.log("vote!");
    }
});

var NewPostList = Backbone.Collection.extend({
    
    model: Post,
    
    first: function() {
        return this.at(0);
    },
    
    comparator: function(post) {
        return post.get("timestamp");
    }
});


var NewPostListView = Backbone.View.extend({
    tagName: 'div',
    
    template: _.template('<div id="new-post-container"></div>'),
    
    events: {},
    
    initialize: function() {
        this.model.bind('change', this.render, this);
        this.model.bind('add', this.render, this);
        this.model.bind('remove', this.render, this);
    },
    
    render: function() {
        console.log("rendering post list view");
        // get the current first item from the collection and display it.
        $(this.el).children().remove();
        
        var currentShownPost = this.model.first();
        
        $(this.el).append(new PostView({model:currentShownPost}).render().el);
        
        return this;
    }
    
});

