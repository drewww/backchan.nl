var should = require('should'),
    model = require('../lib/server-model.js');

describe('server model', function(){
  describe('ServerPost', function(){
    it('should create properly with no arguments', function(){
      var newServerPost = new model.ServerPost();
      
      should.exist(newServerPost);
      
      newServerPost.get("fromId").should.equal(-1);
      newServerPost.get("text").should.equal("default text");
      newServerPost.votes().should.equal(0);
    });
    
    it('should increment ids on each new Post', function(){
        var firstServerPost = new model.ServerPost();
        var secondServerPost = new model.ServerPost();

        firstServerPost.get("id").should.equal(0);
        secondServerPost.get("id").should.equal(1);
    });
  });
});