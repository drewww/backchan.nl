var should = require('should'),
    server = require('../lib/server.js'),
    client = require('../static/js/client.js');
   

describe('client-server communication', function(){
    describe('client', function(done){
        beforeEach(function(done) {
            server.start("localhost", 8181, done);
        });
        afterEach(function(done) {
            server.stop(done);
        });
        
        it('should connect properly', function(done){
                // Once the server has started, make a client.
                var cm = new client.ConnectionManager();
                
                cm.bind("state.CONNECTED", function() {
                    done();
                });
                cm.connect("localhost", 8888);
        });
        
        it('should handle identify commands', function(done) {
            var cm = new client.ConnectionManager();
            
            cm.bind("state.CONNECTED", function() {
                cm.identify("Test User", "Test Affiliation");
            });
            
            cm.bind("state.IDENTIFIED", function(done) {
                
                should.exist(cm.localUser);
                cm.localUser.get("name").should.equal("Test User");
                cm.localUser.get("affiliation").should
                    .equal("Test Affiliation");
                
                done();
            });
            
            cm.connect("localhost", 8888);
        });
    });
});