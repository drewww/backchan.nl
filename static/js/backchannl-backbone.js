var Post = Backbone.Model.extend({
    initialize: function() {
        console.log("initing post");
    },
    
    add_vote: function(at_timestamp) {
        if(_.isUndefined(at_timestamp) || _.isNull(at_timestamp)) {
            at_timestamp = Date.now();
        }
        
        var currentVoteList = this.get("votes");
        currentVoteList.push(at_timestamp);
        this.set({"votes":currentVoteList});
        
        console.log("Adding vote, total: " + this.get("votes").length);
    },
    
    
    defaults: function() {
        return {
        from_name: "default name",
        from_affiliation: "nowhere",
        text: "default text",
        timestamp: Date.now(),
        votes: [Date.now()]};
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
        "click .dismiss-button" : "dismiss",
        "click .vote-button" : "vote"},
    
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


var NewPostListView = Backbone.View.extend({
    tagName: 'div',
    id: 'new',
    
    template: _.template('<h1>new</h1>'),

    // We may not need any here, not sure yet.
    events: {},
    
    initialize: function() {
        this.collection.bind('change', this.render, this);
        this.collection.bind('add', this.render, this);
        this.collection.bind('remove', this.render, this);
    },
    
    render: function() {
        console.log("rendering post list view");
        // get the current first item from the collection and display it.
        
        $(this.el).html(this.template());
        
        var currentShownPost = this.collection.first();
        $(this.el).append(new PostView({model:currentShownPost}).render().el);
        
        return this;
    }
    
});


// If I was smart I'd be extending these from some base class, but let me get
// it all working first and then take it from there.
var HotPostListView = Backbone.View.extend({
   tagName: 'div',
   id: 'hot',
   
   template: _.template('<h1>hot</h1>'),
   
   events: {},
   
   initialize: function() {
       this.collection.bind('change', this.render, this);
       this.collection.bind('add', this.render, this);
       this.collection.bind('remove', this.render, this);
   },
   
   render: function() {
       console.log("rendering HOT post list view");
       // get the current first item from the collection and display it.
       
       $(this.el).html(this.template());
       
       var currentShownPost = this.collection.first();
       
       if(!_.isUndefined(currentShownPost))
        $(this.el).append(new PostView({model:currentShownPost}).render().el);
       
       return this;
   }
   
});

