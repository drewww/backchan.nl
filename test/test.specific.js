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

    it('should be a placeholder');
});