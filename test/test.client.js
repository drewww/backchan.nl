var should = require('should'),
    server = require('../lib/server.js'),
    client = require('../static/js/client.js');
   

var curServer;

describe('client-server communication', function(){

    describe('client', function(done){
        beforeEach(function(done) {
            curServer = new server.BackchannlServer();
            curServer.bind("started", done);
            curServer.start("localhost", 8181);
        });
        afterEach(function(done) {
            curServer.bind("stopped", done);
            curServer.stop();
        });
        
        it('should connect properly', function(done){
                // Once the server has started, make a client.
                var cm = new client.ConnectionManager();
                
                cm.bind("state.CONNECTED", function() {
                    done();
                });
                cm.connect("localhost", 8181);
        });
        
        it('should handle identify commands', function(done) {
            var cm = new client.ConnectionManager();
            
            cm.bind("state.CONNECTED", function() {
                cm.identify("Test User", "Test Affiliation");
            });
            
            cm.bind("state.IDENTIFIED", function() {
                
                should.exist(cm.user);
                cm.user.get("name").should.equal("Test User");
                cm.user.get("affiliation").should
                     .equal("Test Affiliation");
                
                done();
            });
            cm.connect("localhost", 8181);
        });
    });
});