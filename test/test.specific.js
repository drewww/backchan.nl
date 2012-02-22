var should = require('should'),
    server = require('../lib/server.js'),
    client = require('../static/js/client.js'),
    model = require('../lib/server-model.js');
   

var curServer, curClient;
var clients;

describe('join/leave process', function() {
    before(function(done) {
        curServer = new server.BackchannlServer();
        curServer.bind("started", done);
        curServer.start("localhost", 8181);
    });
    beforeEach(function(done) {
        curServer.reset({"test-event":true, "dispatcher":"spread"});

        curClient = new client.ConnectionManager();
        curClient.bind("state.CONNECTED", done);
        curClient.connect("localhost", 8181);
        
    });
    after(function(done) {
        curServer.bind("stopped", done);
        curServer.stop();
    });

    it('user leaving an event they are multiply joined to wont cause all sockets to leave', function(done){
        curClient.bind("state.IDENTIFIED", function() {
            curClient.join(0);
        });
        
        curClient.bind("state.JOINED", function() {
            secondClient.connect("localhost", 8181);
        });
        
        curClient.identify("Test", "Organization");
    
    
        var secondClient = new client.ConnectionManager();
        var thirdClient = new client.ConnectionManager();
    
        secondClient.bind("state.CONNECTED", function() {
            secondClient.identify("Test", "Organization");
        });
        
        thirdClient.bind("state.CONNECTED", function() {
            thirdClient.identify("Another Person", "Organization");
        })
    
        secondClient.bind("state.IDENTIFIED", function() {
            secondClient.join(0);
        });
        
        thirdClient.bind("state.IDENTIFIED", function() {
            thirdClient.join(0);
        });
        
        thirdClient.bind("state.JOINED", function() {
            thirdClient.post("post after leaving");
        });
    
        secondClient.bind("state.JOINED", function() {
            secondClient.leave();
        });
        
        secondClient.bind("message.leave-ok", function() {
            thirdClient.connect("localhost", 8181);
        });
    
        curClient.bind("message.post", function(post) {
            post.should.exist
            post.get("text").should.equal("post after leaving");
            done();
        });
    });
});