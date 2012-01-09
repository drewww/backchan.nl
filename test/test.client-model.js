var should = require('should'),
    model = require('../static/js/model.js');


describe('client model', function() {
    describe('Post', function() {
        it('should have default values when created with no attributes',
            function() {
                var newPost = new model.Post();
        
                should.exist(newPost);
                newPost.get("fromId").should.equal(-1);
                newPost.get("text").should.equal("default text");
                newPost.votes().should.equal(0);
            });
            
        it('should respond to alternate constructor values properly', 
            function() {
            var newPost = new model.Post({"fromName":"Drew",
                "fromAffiliation":"MIT Media Lab",
                "fromId":0,
                "text":"Welcome to backchan.nl!"});
                
                should.exist(newPost);
                newPost.get("fromName").should.equal("Drew");
                newPost.get("fromAffiliation").should.equal("MIT Media Lab");
                newPost.get("fromId").should.equal(0);
                newPost.get("text").should.equal("Welcome to backchan.nl!");
                newPost.votes().should.equal(0);
        });
        
        it('should accumulate votes properly', function() {
            
            var newPost = new model.Post();
            should.exist(newPost);
            
            newPost.addVote(0);
            newPost.addVote(1);
            newPost.addVote(2);
            
            newPost.votes().should.equal(3);
        });
        
        it('should reject votes from the same person', function() {
            var newPost = new model.Post();
            should.exist(newPost);
            
            newPost.addVote(0);
            newPost.addVote(0);
            newPost.addVote(0);
            
            newPost.votes().should.equal(1);
        });
        
        it('should report existing votes properly', function() {
            var newPost = new model.Post();
            should.exist(newPost);
            
            newPost.addVote(0);
            
            newPost.hasVoteFrom(0).should.be.true;
            newPost.hasVoteFrom(1).should.be.false;
            newPost.hasVoteFrom(2).should.be.false;
        });
        
        it('should return recentVotes within a specified time window',
            function() {
                var newPost = new model.Post();
                should.exist(newPost);
                
                newPost.addVote(1, Date.now()-5000);
                newPost.addVote(2, Date.now()-20000);

                
                newPost.recentVotes(10000).should.equal(1);
                newPost.mostRecentVote().should.have.property('id', 1);
        });
        
        it('should be non-promoted on creation', function(){
            var newPost = new model.Post();
            should.exist(newPost);
            
            newPost.isPromoted().should.be.false;
        });
        
        var post;
        describe('.getScore()', function(){
            beforeEach(function() {
             // make an event and a post.
             // we're hardcoding the start time to make vote math
             // more sensible.
             var event = new model.Event({"start":0});
             
             post = new model.Post({"event":event});
            });
            
            it('should have zero score when created', function(){
                post.getScore().should.equal(0);
            });
            
            it('should have 1 point with one vote at start time', function(){
                post.addVote(0, 0);
                post.getScore().should.equal(1);
            });
            
            it('should have slightly more than 1 point with one vote after start time', function(){
                post.addVote(0, 30000);
                (post.getScore()>1).should.be.true;
                (post.getScore()<1.1).should.be.true;
            });
            
            it('should have slightly more than 2 points with two votes', function(){
                post.addVote(0, 30000);
                post.addVote(1, 60000);
                (post.getScore()>2).should.be.true;
                (post.getScore()<2.1).should.be.true;
            });
        });
    });
    
    describe('User', function(){
      it('should have default values', function(){
        var newUser = new model.User();
        
        should.exist(newUser);
        
        newUser.get("name").should.equal("default name");
        newUser.get("affiliation").should.equal("default affiliation");
      });
      
      it('should accept custom values', function(){
        
        var newUser = new model.User({"name":"Drew Harry",
            "affiliation":"MIT Media Lab"});
        
        should.exist(newUser);

        newUser.get("name").should.equal("Drew Harry");
        newUser.get("affiliation").should.equal("MIT Media Lab");
      });
    });
    
    describe('Chat', function(){
        it('should have default values', function(){
            var newChat = new model.Chat();
            
            should.exist(newChat);
            newChat.get("fromName").should.equal("default");
            newChat.get("fromAffiliation").should.equal("default affiliation");
            newChat.get("text").should.equal("default message");
            newChat.get("admin").should.be.false;
        });
    });
    
    describe('Event', function(){
      it('should have default values', function(){
        var newEvent = new model.Event();
        
        should.exist(newEvent);
        newEvent.get("title").should.equal("Default Event Title");
        (newEvent.get("chat") instanceof model.ChatList).should.be.true;
        (newEvent.get("posts") instanceof model.PostList).should.be.true;
      });
    });
    
    describe('PostList', function(){
        it('should create properly', function(){
            var newList = new model.PostList();
            
            newList.should.exist;
            newList.length.should.equal(0);
        });
        
        it('should sort a simple list properly', function(){
            var postList = new model.PostList();
            
            var event = new model.Event({"start":0});
            
            postList.add(new model.Post({"id":0,
                "event":event}));
            postList.add(new model.Post({"id":1,
                "event":event}));
            postList.add(new model.Post({"id":2,
                "event":event}));
            postList.add(new model.Post({"id":3,
                    "event":event}));

            
            // should be ranked third
            postList.get(0).addVote(0, 0);
            postList.get(0).addVote(1, 0);
            
            // should be ranked second
            postList.get(1).addVote(0, 10000);
            postList.get(1).addVote(1, 10000);
            postList.get(1).addVote(2, 10000);
            
            // should be ranked first
            postList.get(2).addVote(0, 600000);
            postList.get(2).addVote(1, 600000);
            
            // should be ranked last
            postList.get(3).addVote(0, 600000);
            
            // OKAY ACTUAL TEST HERE
            postList.at(0).id.should.equal(2);
            postList.at(1).id.should.equal(1);
            postList.at(2).id.should.equal(0);
            postList.at(3).id.should.equal(3);
        });
    });
});
