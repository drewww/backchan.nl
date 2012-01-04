var should = require('should'),
    server = require('../lib/server.js'),
    client = require('../static/js/client.js'),
    model = require('../lib/server-model.js');
   

var curServer, curClient;
var clients;

describe('dispatcher', function() {
    describe('BaseDispatch', function() {
        before(function(done) {
            curServer = new server.BackchannlServer();
            curServer.bind("started", done);
            curServer.start("localhost", 8181);
        });

        beforeEach(function(done) {
            curServer.reset({"test-event":true});

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
        });

        after(function(done) {
            curServer.bind("stopped", done);
            curServer.stop();
        });

        it('should receive notices about new posts', function(done){
            var dispatch = curServer.events.get(0).get("dispatch");

            dispatch.should.exist;

            dispatch.bind("post.new", function(post) {

               post.should.exist;
               post.get("text").should.equal("hello world");

               done();
            });

            clients[0].post("hello world");
        });

        it('should receive notices about post votes', function(done){
            var dispatch = curServer.events.get(0).get("dispatch");

            dispatch.should.exist;

            dispatch.bind("post.new", function(post) {
                // now vote with other client
                clients[1].vote(post.id);
            });

            dispatch.bind("post.vote", function(post, voter) {
                post.should.exist;
                voter.should.exist;

                post.get("fromId").should.not.equal(voter.id);
                voter.id.should.equal(clients[1].user.id);
                done();
            });

            clients[0].post("hello world");
        });

        it('should handle promotes properly', function(done){

            // basically the goal here is just to call promote and see
            // if the second client gets a post event and if the first
            // client gets a promoted message
            var dispatch = curServer.events.get(0).get("dispatch");
            var thePost;

            dispatch.should.exist;

            dispatch.bind("post.new", function(post) {
                // now promote the post.
                dispatch.promotePost(post);
                thePost = post;

            });

            clients[1].bind("message.post", function(post) {
                // did the second client get added to the post properly?
                thePost.isPromoted().should.be.true;

                post.isPromoted().should.be.true;

                post.get("text").should.equal("hello world");
                post.votes().should.equal(1);

                done();
            })

            clients[0].post("hello world");
        });
    });
});
