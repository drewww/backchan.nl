var should = require('should'),
    server = require('../lib/server.js'),
    client = require('../static/js/client.js'),
    fs = require('fs'),
    actions = require('../lib/actions.js'),
    model = require('../lib/server-model.js');
   

var curServer, curClient;


describe('journaling', function() {
    before(function(done) {
        curServer = new server.BackchannlServer();
        curServer.bind("started", done);
        curServer.start("localhost", 8181);
    });
    
    beforeEach(function(done) {
        // delete the contents of the event directory. 
        actions.flushAllJournals();
        
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
    
    it('should create a log file for the event when actions happen', function(done){

        curClient.bind("message.chat", function() {
            curClient.post("FIRST");
        });
        
        curClient.bind("message.post", function() {
            // now check the log file to see if we've got all the data.
            var filename = actions.baseEventsDir + curClient.event.id + ".act";
            var file = fs.readFileSync(filename, 'utf8').split("\n");
            
            file.should.exist;
            
            // it's two lines long, but the last line ends in a \n so it's 
            //technically 3 total lines.
            file.length.should.equal(2+1);
            
            var chatAction = JSON.parse(file[0]);
            
            chatAction.type.should.equal("CHAT");
            chatAction.params.text.should.equal("hello world!");
            chatAction.eventId.should.equal(0);
            chatAction.userId.should.equal(0);
            
            
            var postAction = JSON.parse(file[1]);
            
            postAction.type.should.equal("POST");
            postAction.params.text.should.equal("FIRST");
            postAction.eventId.should.equal(0);
            postAction.userId.should.equal(0);
            
            done();
        });
        
        
        curClient.chat("hello world!");
        
    });
});