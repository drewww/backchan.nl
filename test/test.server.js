var should = require('should'),
    server = require('../lib/server.js');
    client = require('../static/js/client.js');

describe('server', function(){
    
    // This test is temporarily disabled because I don't have a way to shut
    // down the server. For now, all server tests are happening in
    // test.client.js 
    it('should start up without errors', function(done){
        
        var s = new server.BackchannlServer();
        
        s.bind("started", function() {
            s.stop();
        });
        
        s.bind("stopped", function() {
            setTimeout(done, 10);
        });
        
        s.start("localhost",8181);
    });
    
    describe('interactions with clients', function(){
        var curServer;
        
        beforeEach(function(done) {
            curServer = new server.BackchannlServer();
            curServer.bind("started", done);
            curServer.start("localhost", 8181);
        });
        afterEach(function(done) {
            curServer.bind("stopped", done);
            curServer.stop();
        });
        
        it('should count connected users properly', function(done){
            var c = new client.ConnectionManager();
            
            curServer.allUsers.numConnectedUsers().should.equal(0);
            
            c.bind("state.IDENTIFIED", function() {
                curServer.allUsers.numConnectedUsers().should.equal(1);
                
                curServer.bind("client.disconnected", function() {
                    curServer.allUsers.numConnectedUsers().should.equal(0);
                    setTimeout(done(), 50);
                });
                c.disconnect();
            });
            
            c.bind("state.CONNECTED", function() {
                c.identify("Test", "Test");
            });
            
            
            c.connect("localhost", 8181);
        })
    });
});