var should = require('should'),
    server = require('../lib/server.js'),
    client = require('../static/js/client.js'),
    model = require('../lib/server-model.js');
   

var curServer, curClient;
var clients;

describe('client-server communication', function(){

    describe('client', function(done){
        before(function(done) {
            curServer = new server.BackchannlServer();
            curServer.bind("started", done);
            curServer.start("localhost", 8181);
        });
        beforeEach(function() {
            curServer.reset();
        });
        after(function(done) {
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
        
        // This is going to be a bit of a bear to test + figure out. But worth
        // doing at some point. Leaving it here a a reminder.
        it('should handle the server disappearing and reconnect gracefully');
    });
    
    describe('server', function(){
        describe('connect process', function(){
            before(function(done) {
                curServer = new server.BackchannlServer();
                curServer.bind("started", done);
                curServer.start("localhost", 8181);
            });
            beforeEach(function() {
                curServer.reset();
            });
            after(function(done) {
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
        
        
        describe('join/leave process', function(){
            before(function(done) {
                curServer = new server.BackchannlServer();
                curServer.bind("started", done);
                curServer.start("localhost", 8181);
            });
            beforeEach(function(done) {
                curServer.reset({"test-event":true});

                curClient = new client.ConnectionManager();
                curClient.bind("state.CONNECTED", done);
                curClient.connect("localhost", 8181);
                
            });
            after(function(done) {
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
                    curServer.allUsers.get(0).isInEventId(0).should.be.true;
                    done();
                });
                
                curClient.identify("Test", "Test");
            });
            
            it('should receive messages on the right channel', function(done){
                curClient.bind("state.IDENTIFIED", function() {
                    curClient.join(0);
                });
                
                curClient.bind("message.join-err", function() {
                    should.fail("Shouldn't get a join-err message.");
                });
                
                curClient.bind("message.join-ok", function() {
                    // Now have the server send a message to that channel.
                    curServer.io.sockets.in(
                        curServer.events.get(0).getChannel())
                        .emit("test");
                });
                
                curClient.bind("message.test", function() {
                    done();
                })
                
                curClient.identify("Test", "Test");
            });
            
            
            it('should not receive messages on other channels', function(done) {
                curClient.bind("state.IDENTIFIED", function() {
                    curClient.join(0);
                });
                
                curClient.bind("message.join-err", function() {
                    should.fail("Shouldn't get a join-err message.");
                });
                
                curClient.bind("message.join-ok", function() {
                    // Send a message to some other channel. We shouldn't
                    // receive anything.
                    curServer.io.sockets.in("foo").emit("test");
                    
                    // Wait 100ms and then pass the test - if the server
                    // was going to actually send us the wrong thing, it would
                    // have done it by then.
                    setTimeout(done, 50);
                });
                
                curClient.bind("messages.test", function() {
                    should.fail("Should not have received this message");
                })
                
                curClient.identify("Test", "Test");
                
            });
            
            it('should remove users from the event when they disconnect', 
                function(done) {
                    curClient.bind("state.IDENTIFIED", function() {
                        curClient.join(0);
                    });
                    
                    curClient.bind("message.join-err", function() {
                        should.fail("Shouldn't get a join-err message.");
                    });
                    
                    curClient.bind("message.join-ok", function() {
                        // Now disconnect.
                        curClient.disconnect();
                        
                        setTimeout(function() {
                            curServer.events.get(0).get("users")
                                .length.should.equal(0);
                            
                            curServer.allUsers.get(0).isInEvent(0).should.be.false;
                            done();
                        }, 50);
                        // After disconnecting, poke at the server to see if
                        // the user was removed from the event properly.
                    });

                    curClient.identify("Test", "Test");
            });

            it('should remove users when they send a \'leave\' command',
                function(done) {
                    curClient.bind("state.IDENTIFIED", function() {
                        curClient.join(0);
                    });
                    
                    curClient.bind("message.join-ok", function() {
                        curClient.leave();
                    });
                    
                    curClient.bind("message.leave-err", function() {
                        should.fail("Shouldn't get a leave-err message.");
                    });
                    
                    curClient.bind("message.leave-ok", function() {
                        curServer.events.get(0).get("users")
                            .length.should.equal(0);
                            
                        curServer.allUsers.get(0).isInEvent(0).should.be.false;                        
                        
                        done();
                    });
                    
                    curClient.identify("Test", "Test");
            });
            
            it('should fail to leave if not actually in an event',
                function(done) {
                    curClient.bind("state.IDENTIFIED", function() {
                        curClient.leave();
                    });
                    
                    
                    curClient.bind("message.leave-err", function() {
                        done();
                    });
                    
                    curClient.bind("message.leave-ok", function() {
                        should.fail("Leave should not succeed if client is not in an event.");
                    });
                    
                    curClient.identify("Test", "Test");
            });
                
                
            it('should properly move users from one event to another if they try to join a new event', 
                function(done) {
                    curClient.bind("state.IDENTIFIED", function() {
                        curClient.join(0);
                    });
                    
                    curClient.bind("message.join-err", function() {
                        should.fail("Shouldn't get a join-err message.");
                    });
                    
                    var secondJoin = false;
                    
                    curClient.bind("message.join-ok", function() {
                        
                        if(!secondJoin) {
                            // Now create a new event, and have the client join
                            // that one.
                        
                            curClient.join(1);
                            secondJoin = true;
                        } else {
                            
                            // Make sure we left one and joined the other.
                            curServer.events.get(0).get("users").length.should.equal(0);
                            curServer.events.get(1).get("users").length.should.equal(1);
                            
                            curServer.allUsers.get(0).isInEventId(0).should.be.false;
                            curServer.allUsers.get(0).isInEventId(1).should.be.true;
                            
                            done();
                        }
                    });
                    
                    curServer.events.add(new model.ServerEvent());

                    curClient.identify("Test", "Test");
                });
                
                it('should reinflate the Event object', function(done) {
                    curClient.bind("state.IDENTIFIED", function() {
                        
                        // Join eventId 1 because ID 0 is the default test
                        // event.
                        curClient.join(1);
                    });
                    
                    curClient.bind("message.join-err", function() {
                        should.fail("Shouldn't get a join-err message.");
                    });
                    
                    curClient.bind("message.join-ok", function(newEvent) {
                        
                        (newEvent instanceof model.Event).should.be.true;
                        newEvent.get("title").should.equal("Test Event");
                        
                        done();
                    });
                    
                    curServer.events.add(new model.ServerEvent({
                        title:"Test Event"
                        }));

                    curClient.identify("Test", "Test");
                });
                
                
                it('should allow another client to connect with the same name/pass to a different event', function(done) {
                   // okay, this is a bit tricky. to run this test we need
                   // 1. another client
                   // 2. another event.
                   
                   curServer.events.add(new model.ServerEvent());
                   var secondClient = new client.ConnectionManager();
                   
                   // keep in mind that our initial client is in the
                   // CONNECTED state, not IDENTIFIED or JOINED.
                   
                   curClient.bind("state.IDENTIFIED", function() {
                       curClient.join(0);
                   });
                   
                   curClient.identify("Test", "Organization");
                   
                   secondClient.bind("state.CONNECTED", function() {
                       secondClient.identify("Test", "Organization");
                   });
                   
                   secondClient.bind("state.IDENTIFIED", function() {
                       secondClient.join(1);
                   });
                   
                   secondClient.bind("state.JOINED", function() {
                       secondClient.user.id.should.equal(curClient.user.id);
                       
                       var serverUser = curServer.allUsers.get(secondClient.user.id);
                       
                       serverUser.isInEventId(0).should.be.true;
                       serverUser.isInEventId(1).should.be.true;
                       
                       done();
                   });
                   
                   secondClient.connect("localhost", 8181);
                });
                
                it('should correctly route messages to a user connected with two clients to two events', function(done) {
                   // okay, this is a bit tricky. to run this test we need
                   // 1. another client
                   // 2. another event.
                   curServer.events.add(new model.ServerEvent());
                   var secondClient = new client.ConnectionManager();
                   
                   // keep in mind that our initial client is in the
                   // CONNECTED state, not IDENTIFIED or JOINED.
                   
                   curClient.bind("state.IDENTIFIED", function() {
                       curClient.join(0);
                   });
                   
                   curClient.identify("Test", "Organization");
                   
                   secondClient.bind("state.CONNECTED", function() {
                       secondClient.identify("Test", "Organization");
                   });
                   
                   secondClient.bind("state.IDENTIFIED", function() {
                       secondClient.join(1);
                   });
                   
                   secondClient.bind("state.JOINED", function() {
                       // now post from curClient and make sure reception
                       // is only by curClient, and vice-versa.
                       curClient.post("hello event 0");
                   });
                   
                   curClient.bind("message.post", function(post) {
                       post.get("text").should.equal("hello event 0");
                       
                       secondClient.post("hello event 1");
                   });
                   
                   secondClient.bind("message.post", function(post) {
                       post.get("text").should.equal("hello event 1");
                       
                       done();
                   });
                   
                   secondClient.connect("localhost", 8181);
                });
        });
        
        describe('post', function() {
            before(function(done) {
                curServer = new server.BackchannlServer();
                curServer.bind("started", done);
                curServer.start("localhost", 8181);
            });
            
            beforeEach(function(done) {
                curServer.reset({"test-event":true});

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
            
            it('should reject malformed posts', function(done){
                curClient.bind("message.post-ok", function() {
                    should.fail("Should reject a malformed post.");
                });
                
                curClient.bind("message.post-err", function() {
                    done();
                });
              
                curClient.post();
            });
            
            it('should accept proper posts', function(done){
                curClient.bind("message.post-ok", function() {
                    done();
                });
                
                curClient.bind("message.post.err", function() {
                    should.fail("Should accept a properly formed post.");
                });
              
                curClient.post("hello world post");
            });
            
            it('should accumulate posts in the server event object', function(done){
                curClient.bind("message.post-ok", function() {
                    
                    var posts = curServer.events.get(0).get("posts");

                    posts.should.exist;
                    posts.length.should.equal(1);
                    posts.get(0).should.exist;
                    posts.get(0).get("text").should.equal("hello world post");
                    
                    
                    done();
                });
                
                curClient.bind("message.post.err", function() {
                    should.fail("Should accept a properly formed post.");
                });
              
                curClient.post("hello world post");
            });
            
            it('should send post objects to their creators on creation', function(done){
                
                curClient.bind("message.post.err", function() {
                    should.fail("Should accept a properly formed post.");
                });
                
                curClient.bind("message.post", function(post) {
                    post.should.exist;
                    
                    post.get("text").should.equal("hello world post");
                    curClient.event.get("posts").length.should.equal(1);
                    
                    done();
                });
              
                curClient.post("hello world post");
            });
            
            it('should send post objects with proper vote data', function(done){
                
                curClient.bind("message.post.err", function() {
                    should.fail("Should accept a properly formed post.");
                });
                
                curClient.bind("message.post", function(post) {
                    post.should.exist;
                    
                    post.get("text").should.equal("hello world post");
                    curClient.event.get("posts").length.should.equal(1);
                    
                    post.votes().should.equal(0);
                });
                
                curClient.bind("message.vote", function(post) {
                    post.votes().should.equal(1);
                    post.hasVoteFrom(curClient.user.id).should.be.true;
                    done();
                });
              
                curClient.post("hello world post");
            });
            
            it('should not send post objects to non-subscribed users', function(done){
                var otherClient = new client.ConnectionManager();
                otherClient.bind("state.JOINED", function() {
                    curClient.post("hello world post");
                });
                
                otherClient.bind("message.post", function() {
                    should.fail("Received a post message even though the post wasn't published to this client.");
                });
                
                otherClient.connect("localhost", 8181, {
                    "auto-identify":true,
                    "auto-join":true
                });
                
                curClient.bind("message.post.err", function() {
                    should.fail("Should accept a properly formed post.");
                });
                
                curClient.bind("message.post", function(post) {
                    post.should.exist;
                    
                    post.get("text").should.equal("hello world post");
                    curClient.event.get("posts").length.should.equal(1);
                    
                    done();
                });
            });
            
            it('should send existing promoted posts to a newly connected user');
        });
        
        describe('vote', function() {
            before(function(done) {
                curServer = new server.BackchannlServer();
                curServer.bind("started", done);
                curServer.start("localhost", 8181);
            });
            
            beforeEach(function(done) {
                curServer.reset({"test-event":true});

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
            
            it('should reject votes on ids that aren\'t numbers',
                function(done){
                
                curClient.bind("message.post-ok", function() {
                    curClient.vote("asdf");
                });
                
                curClient.bind("message.vote-ok", function() {
                    should.fail("Voted with a non-number postId");
                });

                curClient.bind("message.vote-err", function() {
                    curServer.events.get(0).get("posts")
                        .get(0).votes().should.equal(1);
                    done();
                });
                
                curClient.post("Hello World Post");
            });
            
            it('should reject votes on ids that aren\'t valid postIds',
                function(done){
                    curClient.bind("message.post-ok", function() {
                        curClient.vote(7);
                    });

                    curClient.bind("message.vote-ok", function() {
                        should.fail("Voted with an invalid postId");
                    });

                    curClient.bind("message.vote-err", function() {
                        curServer.events.get(0).get("posts")
                            .get(0).votes().should.equal(1);
                        done();
                    });

                    curClient.post("Hello World Post");
            });
            
            it('should reject votes on posts created by that person',
                function(done){
                    curClient.bind("message.post-ok", function() {
                        curServer.events.get(0).get("posts")
                            .get(0).votes().should.equal(1);
                        
                        curClient.vote(0);
                    });

                    curClient.bind("message.vote-ok", function() {
                        should.fail("Voted from the same client that created a post.");
                    });

                    curClient.bind("message.vote-err", function() {
                        curServer.events.get(0).get("posts")
                            .get(0).votes().should.equal(1);
                        done();
                    });

                    curClient.post("Hello World Post");
            });
            
            it('should accept votes that well formed', function(done){
                var otherClient = new client.ConnectionManager();
                otherClient.bind("state.JOINED", function() {
                    otherClient.post("Hello World Post");
                });

                otherClient.bind("message.post-ok", function() {
                    curClient.vote(0);
                });
                
                var voteCount = 0;
                otherClient.bind("message.vote", function(post) {
                    voteCount++;
                    
                    if(voteCount==2) {
                        post.votes().should.equal(2);
                        done();
                    }
                });
                
                curClient.bind("message.vote-ok", function() {
                    curServer.events.get(0).get("posts")
                        .get(0).votes().should.equal(2);
                });

                curClient.bind("message.vote-err", function() {
                    should.fail("Vote should succeed.");
                });
                
                otherClient.connect("localhost", 8181, {
                    "auto-identify":true,
                    "auto-join":true
                });
            });
            
            it('should reject successive votes from a non-creator', function(done){
                var otherClient = new client.ConnectionManager();
                otherClient.bind("state.JOINED", function() {
                    otherClient.post("Hello World Post");
                });

                otherClient.bind("message.post-ok", function() {
                    curClient.vote(0);
                });
                
                var secondVote = false;
                
                curClient.bind("message.vote-ok", function() {
                    if(!secondVote) {
                        curServer.events.get(0).get("posts")
                            .get(0).votes().should.equal(2);
                        curClient.vote(0);
                        
                        secondVote = true;
                    } else {
                        should.fail("Second vote on the same post should fail.");
                    }
                });

                curClient.bind("message.vote-err", function() {
                    if(secondVote) {
                        curServer.events.get(0).get("posts")
                            .get(0).votes().should.equal(2);
                        done();
                    } else {
                        should.fail("First vote should succeed.");
                    }
                });
                
                otherClient.connect("localhost", 8181, {
                    "auto-identify":true,
                    "auto-join":true
                });
            });
        });
        
        describe('chat', function(){
            before(function(done) {
                curServer = new server.BackchannlServer();
                curServer.bind("started", done);
                curServer.start("localhost", 8181);
            });
            
            beforeEach(function(done) {
                curServer.reset({"test-event":true});

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
            
            it('should correctly reject bad chat messages', function(done) {
                // These tests start in the JOINED state, so we can just send
                // a message immediately.
                curClient.bind("message.chat-ok", function() {
                    should.fail("Chat should not succeed.");
                });
                
                curClient.bind("message.chat-err", function() {
                    done();
                });
                
                curClient.chat();
            });
            
            it('should accept good chat messages',
                function(done) {
                    // These tests start in the JOINED state, so we can just send
                    // a message immediately.
                    curClient.bind("message.chat-ok", function() {
                        done();
                    });

                    curClient.bind("message.chat-err", function() {
                        should.fail("Chat should not fail.");
                    });

                    curClient.chat("hello world");
            });
            
            it('should send chat messages to other people in the event',
                function(done){
                    var otherClient = new client.ConnectionManager();
                    otherClient.bind("state.JOINED", function() {
                        
                        curClient.chat("hello world");
                    });
                    
                    otherClient.bind("message.chat", function() {
                        done();
                    });
                    
                    otherClient.connect("localhost", 8181, {
                        "auto-identify":true,
                        "auto-join":true
                    });
                    
                    curClient.bind("message.chat-err", function() {
                        should.fail("Chat should not fail.");
                    });
            });
            
            it('should not send chat messages to people not in the event',
                function(done) {
                    var otherClient = new client.ConnectionManager();
                    otherClient.bind("state.IDENTIFIED", function() {
                        curClient.chat("hello world");
                    });
                    
                    otherClient.bind("message.chat", function() {
                        console.log("Got a bad chat message.");
                        should.fail("The other client shouldn't receive the message because they're not joined to that event.");
                    });
                    
                    otherClient.connect("localhost", 8181, {
                        "auto-identify":true
                    });
                    
                    curClient.bind("message.chat", function() {
                        done();
                    });
            });
            
            it('should reinflate the chat object on the client with\
 the right data', function(done) {
     
                curClient.bind("message.chat", function(chat) {
                    
                    (chat instanceof model.Chat).should.be.true;
                    chat.get("text").should.equal("hello world");
                    chat.get("admin").should.be.false;
                    
                    // check and see if the timestamp is within the last 
                    // second.
                    var timeSinceMessage = new Date().getTime() -
                        chat.get("timestamp");
                    
                    (timeSinceMessage<1000).should.be.true;
                    done();
                });

                curClient.bind("message.chat-err", function() {
                    should.fail("Chat should not fail.");
                });

                curClient.chat("hello world");
            });
            
            it('should accumulate chat messages in the event object',
                function(done){
                    var receivedCount = 0;
                    
                    curClient.bind("message.chat", function() {
                        receivedCount++;
                        
                        if(receivedCount==3) {
                            curClient.event.get("chat").length.should.equal(3);
                            done();
                        }
                    });

                    curClient.bind("message.chat-err", function() {
                        should.fail("Chat should not fail.");
                    });

                    curClient.chat("hello world");
                    curClient.chat("hello world");                    
                    curClient.chat("hello world");
            });
        });
    });
});