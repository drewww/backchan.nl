var should = require('should'),
    server = require('../lib/server.js'),
    client = require('../static/js/client.js'),
    model = require('../lib/server-model.js');
   

var curServer, curClient;


describe('journaling', function() {
    before(function(done) {
        curServer = new server.BackchannlServer();
        curServer.bind("started", done);
        curServer.start("localhost", 8181);
    });
    
    beforeEach(function(done) {
        curServer.reset({"test-event":true, "journaling":true});

        curClient = new client.ConnectionManager();
        
        curClient.bind("state.JOINED", function() {
            done();
        });
        
        curClient.connect("localhost", 8181, {
            "auto-identify":true,
            "auto-join":true
        });
    });
    
    after(function(done) {
        curServer.bind("stopped", done);
        curServer.stop();
    });
    
    it('should not crash when journaling is turned on', function(){
        
    });
});