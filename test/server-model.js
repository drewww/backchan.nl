var should = require('should'),
    model = require('../lib/server-model.js');

describe('server model', function(){
    beforeEach(function(done) {
        model.resetIds();
        done();
    });
    
    
    describe('ServerPost', function(){
        it('should create properly with no arguments', function(){
          var newServerPost = new model.ServerPost();
      
          should.exist(newServerPost);
      
          newServerPost.get("fromId").should.equal(-1);
          newServerPost.get("text").should.equal("default text");
          newServerPost.votes().should.equal(0);
        });
    
        it('should create properly with arguments', function(){
            var newPost = new model.ServerPost({"fromName":"Drew",
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
    
        it('should increment ids on each new Post', function(){
            var firstServerPost = new model.ServerPost();
            var secondServerPost = new model.ServerPost();

            firstServerPost.get("id").should.equal(0);
            secondServerPost.get("id").should.equal(1);
        });
  });
  
  describe('ServerUser', function(){
      
      beforeEach(function(done) {
          model.resetIds();
          done();
      });
      
      it('should create properly with no arguments', function(){
          var newServerUser = new model.ServerUser();
      
          newServerUser.get("name").should.equal("default name");
          newServerUser.get("affiliation").should.equal("default affiliation");
          newServerUser.get("id").should.equal(0);
        });
    
        it('should create properly with arguments', function(){
            var newServerUser = new model.ServerUser({"name":"Drew Harry",
                "affiliation":"MIT Media Lab"});
        
            newServerUser.get("name").should.equal("Drew Harry");
            newServerUser.get("affiliation").should.equal("MIT Media Lab");
            newServerUser.get("id").should.equal(0);
        });
    
        it('should increment userids properly', function(){
            var firstNewUser = new model.ServerUser();
            var secondNewUser = new model.ServerUser();
      
            firstNewUser.get("id").should.equal(0);
            secondNewUser.get("id").should.equal(1);
        });
    });
});