var should = require('should'),
    server = require('../lib/server.js');
    client = require('../static/js/client.js');

describe('server', function(){
    
    // This test is temporarily disabled because I don't have a way to shut
    // down the server. For now, all server tests are happening in
    // test.client.js 
    describe('startup', function(){
        it('should work with default configuration', function(done){

            var s = new server.BackchannlServer();

            s.bind("started", function() {
                s.stop();
            });

            s.bind("stopped", function() {
                setTimeout(done, 10);
            });

            s.start("localhost",8181);
        });
        
        it('should work with initial ServerEvent', function(done){
            var s = new server.BackchannlServer({"test-event":true});

            s.bind("started", function() {
                
                s.events.length.should.equal(1);
                s.events.get(0).should.exist;
                s.events.get(0).get("title").should.equal("Default Event Title");
                s.stop();
            });

            s.bind("stopped", function() {
                setTimeout(done, 10);
            });

            s.start("localhost",8181);
        });
        
        it('should have no events when it started', function(done){
            var s = new server.BackchannlServer();
            
            
            s.bind("started", function() {
               s.events.length.should.equal(0);
               s.stop(); 
            });
            
            s.bind("stopped", function() {
                setTimeout(done, 10);
            });
            
            s.start("localhost", 8181);
        });
    });
});