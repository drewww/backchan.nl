var should = require('should'),
    model = require('../static/js/model.js');


describe('models: ', function() {
    describe('Post', function() {
        it('should have default values when created with no attributes',
            function() {
                var newPost = new model.Post();
        
                should.exist(newPost);
                newPost.get("fromId").should.equal(-1);
                newPost.get("text").should.equal("default text");
                newPost.votes().should.equal(0);
            });
            
        it('should accumulate votes properly', function() {
            
            var newPost = new model.Post();
            should.exist(newPost);
            
            newPost.addVote(null, 0);
            newPost.addVote(null, 1);
            newPost.addVote(null, 2);
            
            newPost.votes().should.equal(3);
        });
        
        it('should reject votes from the same person', function() {
            var newPost = new model.Post();
            should.exist(newPost);
            
            newPost.addVote(null, 0);
            newPost.addVote(null, 0);
            newPost.addVote(null, 0);
            
            newPost.votes().should.equal(1);
        });
        
        it('should report existing votes properly', function() {
            var newPost = new model.Post();
            should.exist(newPost);
            
            newPost.addVote(null, 0);
            
            newPost.hasVoteFrom(0).should.be.true;
            newPost.hasVoteFrom(1).should.be.false;
            newPost.hasVoteFrom(2).should.be.false;
        });
    });    
});
