var should = require('should'),
    server = require('../lib/server.js'),
    client = require('../static/js/client.js'),
    fs = require('fs'),
    actions = require('../lib/actions.js'),
    sync = require('../lib/redis-sync.js'),
    model = require('../lib/server-model.js'),
    redis = require('redis').createClient();
   

var curServer, curClient;


describe('writing actions', function() {
    before(function(done) {
        curServer = new server.BackchannlServer();
        curServer.bind("started", done);
        curServer.start("localhost", 8181);
        actions.flushAllJournals();
        sync.flush();
    });
    
    beforeEach(function(done) {
        // delete the contents of the event directory. 
        sync.flush();
        actions.flushAllJournals();
        
        curServer.reset({"test-event":true, "persist":true});

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
            setTimeout( function(){
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
            }, 10);
        });
        curClient.chat("hello world!");
    });
    
    
    it('should create a user and event in the redis store', function(done){
        // check redis to see if it's got a user and an event.
        redis.get("user." + curClient.user.id, function(err, userJSON) {
            userJSON.should.exist;
            
            var user = JSON.parse(userJSON);
            
            user.should.exist;
            user.id.should.equal(curClient.user.id);
            user.name.should.equal(curClient.user.get("name"));
            user.affiliation.should.equal(curClient.user.get("affiliation"));

            redis.get("event." + curClient.event.id, function(err, eventJSON){
                
                var event = JSON.parse(eventJSON);
                event.should.exist;

                event.id.should.equal(curClient.event.id);
                event.title.should.equal(curClient.event.get("title"));
                event.start.should.equal(curClient.event.get("start"));
                event.voteTimeScoreFactor.should.equal(curClient.event.get("voteTimeScoreFactor"));

                done(); 
            });
        });
    });
});

var clients = [];

describe('loading actions', function(){
    before(function(done) {
        curServer = new server.BackchannlServer();
        curServer.bind("started", done);
        curServer.start("localhost", 8181);
    });

    beforeEach(function(done) {
        sync.flush();
        // delete the contents of the event directory. 
        curServer.reset({"test-event":true,
         "callback":function () {
            clients = [];
        
            clients.push(new client.ConnectionManager());
            clients.push(new client.ConnectionManager());
        
            clients[0].bind("state.JOINED", function() {
                clients[1].connect("localhost", 8181, {
                    "auto-identify":true,
                    "auto-join":true
                });                    
            });
        
            clients[1].bind("state.JOINED", function() {
                done();
            })
        
            clients[0].connect("localhost", 8181, {
                "auto-identify":true,
                "auto-join":true
            });
        }});
    });

    after(function(done) {
        sync.flush();
        sync.resetIds();
        curServer.bind("stopped", done);
        curServer.stop();
    });
    
    it('should load an event from disk', function(done){
        // step 1: have 2 clients connect and make a bunch of posts, chats
        //          and vote on things.
        
        // okay so we have two clients joined. Have them make some noise.
        console.log("starting test");
        clients[0].chat("hello WORLD!");
        clients[1].chat("how's it going?");
        
        clients[0].post("FIRST");
        clients[1].post("SECOND");
        
        clients[0].vote(0);
        
        // step 2: reset the server with the load flag
        setTimeout(function() {
            curServer.reset({"load":true, "callback":
                function() {
                    
                    
                    // step 3: inspect the event object that gets reloaded.
                    var event = curServer.events.get(0);

                    event.should.exist; // this is loading from redis, since
                                        // test-event: false for this reset.

                    event.fetch();
                    
                    // now check its state.
                    event.get("chat").length.should.equal(2);
                    event.get("chat").at(1).get("text").should.equal("hello WORLD!");
                    event.get("chat").at(0).get("text").should.equal("how's it going?");
                    
                    event.get("posts").length.should.equal(2);
                    event.get("posts").get(1).get("text").should.equal("FIRST");
                    event.get("posts").get(0).get("text").should.equal("SECOND");

                    event.get("posts").get(1).votes().should.equal(2);
                    event.get("posts").get(0).votes().should.equal(1);
                    
                    done();
            }});
        }, 100);
    });

});

describe('loading redis', function(){
        before(function(done) {
            curServer = new server.BackchannlServer();
            curServer.bind("started", done);
            curServer.start("localhost", 8181);
        });

        beforeEach(function(done) {
            sync.flush();
            // delete the contents of the event directory. 
            curServer.reset({"load":true, "callback":done});
        });

        after(function(done) {
            sync.flush();
            sync.resetIds();
            curServer.bind("stopped", done);
            curServer.stop();
        });

        it('should load properly with no files', function(){
            
        });
        
        it('should save + load events', function(done){
            var events = [];
            events[0] = new model.ServerEvent();
            events[1] = new model.ServerEvent();
            
            events[0].save(null, {success:function() {
                events[1].save(null, {success: function() {
                    // make the events (which will save them), then reset
                    // the server and trigger loading from scratch. 
                    curServer.reset({"load":true, "callback": function() {

                        curServer.events.length.should.equal(2);
                        done();
                    }});
                }});
            }});
        });
        
        it('should save + load users', function(done){
            var users = [];
            users[0] = new model.ServerUser();
            users[1] = new model.ServerUser();
            
            users[0].save(null, {success:function() {
                users[1].save(null, {success: function() {
                    // make the users (which will save them), then reset
                    // the server and trigger loading from scratch. 
                    curServer.reset({"load":true, "callback": function() {

                        curServer.allUsers.length.should.equal(2);
                        done();
                    }});
                }});
            }});
        });
});