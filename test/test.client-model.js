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
});
