var should = require('should'),
    server = require('../lib/server.js'),
    client = require('../static/js/client.js');
   

var curServer, curClient;

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
                
                cm.disconnect();
                setTimeout(done, 0);
            });
            cm.connect("localhost", 8181);
        });
        
        
        it('should connect properly', function(done){
                // Once the server has started, make a client.
                var cm = new client.ConnectionManager();
                
                cm.bind("state.CONNECTED", function() {
                    cm.disconnect();
                    done();
                });
                cm.connect("localhost", 8181);
        });
    });
    
    describe('server', function(){
        describe('connect process', function(){
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

                c.connect("localhost", 8181, {"auto-identify":true});
            });
        });
        
        
        describe('join process', function(){
            beforeEach(function(done) {
                curServer = new server.BackchannlServer({"test-event":true});
                curServer.bind("started", function() {
                    curClient = new client.ConnectionManager();
                    curClient.bind("state.CONNECTED", done);
                    curClient.connect("localhost", 8181);
                });
                curServer.start("localhost", 8181);
            });
            afterEach(function(done) {
                curServer.bind("stopped", done);
                curServer.stop();
            });

            it('should reject joins from users who haven\'t identified yet',
                function(done) {
                    curClient.bind("message.join-err", function() {
                        done();
                    });

                    curClient.bind("message.join-ok", function() {
                        should.fail("Received a join-ok message for a client that joined before identifying.");
                    });

                    curClient.join(0);
            });
            
            it('should reject malformed join requests (string)', function(done) {
                curClient.bind("state.IDENTIFIED", function() {
                    // send some bad join requests
                    curClient.join("foo");
                });
                
                curClient.bind("message.join-err", function() {
                    done();
                });
                
                curClient.bind("message.join-ok", function() {
                   should.fail("Received a join-ok message when it should fail.") ;
                });
                
                curClient.identify("Test", "Test");
            });

            it('should reject malformed join requests (bad id)', function(done) {
                curClient.bind("state.IDENTIFIED", function() {
                    // send some bad join requests
                    curClient.join(7);
                });
                
                curClient.bind("message.join-err", function() {
                    done();
                });
                
                curClient.bind("message.join-ok", function() {
                   should.fail("Received a join-ok message when it should fail.") ;
                });
                
                curClient.identify("Test", "Test");
            });
            
            it('should accept proper join requests', function(done) {
                curClient.bind("state.IDENTIFIED", function() {
                    curClient.join(0);
                });
                
                curClient.bind("message.join-err", function() {
                    should.fail("Shouldn't get a join-err message.");
                });
                
                curClient.bind("message.join-ok", function() {
                    curServer.events.get(0).get("users").length.should.equal(1);
                    done();
                });
                
                curClient.identify("Test", "Test");
            });
            
            it('should join the user to the event channel');
        });
    });
});