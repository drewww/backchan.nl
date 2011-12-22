var should = require('should'),
    model = require('../static/js/model.js');


describe('models: ', function() {
    describe('Post', function() {
        describe('#new()', function() {
            it('should have default values when created with no attributes',
                function() {
                    var newPost = new model.Post();
            
                    should.exist(newPost);
                    newPost.get("fromId").should.equal(-1);
                    newPost.get("text").should.equal("default text");
                    newPost.votes().should.equal(0);
                });
        });
    });    
});
