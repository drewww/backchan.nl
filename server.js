var app = require('express').createServer(),
    io = require('socket.io').listen(app),
    redis = require('redis'),
    client = redis.createClient(),
    crypto = require('crypto'),
    express = require('express'),
    fs = require('fs'),
    program = require('commander'),
    logger = require('winston'),
    model = require('./model.js');

logger.cli();
logger.default.transports.console.timestamp = true;


program.version('0.1')
    .option('-p, --port [num]', 'Set the server port (default 8080)')
    .option('-D, --database [num]', 'Set the redis database id to use (default 1)')
    .parse(process.argv);

var server = "localhost";
if(program.args.length==1) {
    server = program.args[0];
} else if(program.args.length==0) {
    logger.info("Defaulting to 'localhost' for server.");
} else {
    logger.info("Too many command line arguments. Expected 0 or 1.")
}
var port = 8080;
if(program.port) {
    logger.info("Setting port to " + program.port);
    port = program.port;
}

app.listen(port);

// Setup static serving from the static directory.
app.use(app.router);
app.use("/static", express.static(__dirname + '/static'));

// Setup the index page.
app.get('/', function(req, res) {
    res.render('index.ejs', {layout:false});
});

app.get('/app', function(req, res) {
    res.render('app.ejs', {layout:false, locals:{"server":server,
        "port":port}});
});

io.set("log level", 0);

// Pass of a reference to socket.io to the model so it can manage its own
// communication.
model.setIo(io);

var allPosts = new model.ServerPostList();
var numConnectedUsers = 0;

var allUsers = new model.ServerUserList();

io.sockets.on('connection', function(socket) {
    
    numConnectedUsers++;
    
    socket.on("identify", function(data) {
        logger.info("identifying: ", data);
        // For now just shove both into a single string. Could call them 
        // out separately, but not sure it really matters. Storing JSON
        // is just an added headache.
        
        logger.info("users: " + allUsers.toJSON());
        
        // Check and see if we know this person already. 
        var user = allUsers.get_user(data["name"], data["affiliation"]);
        
        if(_.isUndefined(user)) {
            logger.info("Unknown user, making a new one for " +
                data["name"] + " / " + data["affiliation"]);
            // Make a new user and save it.
            user = new model.ServerUser(data);
            allUsers.add(user);
            
            logger.info("Making new user: " + data["name"] + "/" + data["affiliation"] + " ("+user.id+")");
            
        } 
        
        user.set({"connected":true});
        
        socket.set("identity", user.id);
        socket.emit("identify", data);
        
        // Now dump all current state. 
        if(allPosts.length > 0) {
            socket.emit("posts.list", {"posts":allPosts.toJSON()});
        }
        
        io.sockets.emit("presence", {"num":numConnectedUsers});
        
    });
    
    socket.on("post", function(data) {
        // Eventually, we'll need to start storing these. For now, just
        // broadcast them to all clients.
        socket.get("identity", function(err, userId) {
            var user = allUsers.get(userId);
            
            if(user==null) {
                logger.error("Had null user in post.");
                return;
            }
            
            data["from_name"] = user.get("name");
            data["from_affiliation"] = user.get("affiliation");
            data["timestamp"] = Date.now();
            data["votes"] = [];
            
            var newPost = new model.ServerPost(data);
            
            newPost.add_vote(Date.now(), user.id);
            
            allPosts.add(newPost);
        });
    });
    
    socket.on("post.vote", function(data) {
        socket.get("identity", function(err, userId) {
            
            logger.debug("userId: " + userId);
            
            if(userId==null) {
                logger.warning("Found a null userId in voting.");
                return;
            }
            
            var user = allUsers.get(userId);
            
            logger.debug("fetchedUser: " + user.id);
            
            var post = allPosts.get(data["id"]);
            
            if(!post.has_vote_from(user.id)) {
                logger.debug("recording vote on post id " + data["id"] + " from " + user.id);
                post.add_vote(Date.now(), user.id);
            } else {
                logger.debug("user has already voted on that post");
                socket.emit("post.vote_failed");
            }
            
            processHotPosts();
        });
    });
    
    socket.on('disconnect', function() {
        // Do something.
        numConnectedUsers--;
        io.sockets.emit("presence", {"num":numConnectedUsers});
        logger.info("connected users now: " + numConnectedUsers);
        socket.get("identity", function(err, userId) {
            var user = allUsers.get(userId);
            
            if(!_.isNull(user)) {
                user.set({"connected":false});
            }
        });
    });
});



function processHotPosts(repeat) {
    if(_.isUndefined(repeat)) repeat = false;
    
    if(repeat) setTimeout(processHotPosts, 5000, true);
    
    logger.debug("process hot posts");
    
    // Run through all posts and figure out which has the most recent votes.
    var topPost = null;
    var topPostScore = 0;
    var mostRecentVoteTimestamp = 0;
    
    allPosts.each(function (post) {
        var postScore = post.recent_votes();
        // console.log("postScore: " + postScore);
        
        if(post.recent_votes() > topPostScore) {
            // console.log("\t setting new top post on score");
            
            topPost = post;
            topPostScore = postScore;
            mostRecentVoteTimestamp = post.most_recent_vote()["timestamp"];
        } else if(post.recent_votes() == topPostScore) {
            
            // console.log("score conflict, evaluating timestamps")
            // console.log("cur top time: " + mostRecentVoteTimestamp + " postTop: " + post.most_recent_vote()["timestamp"]);
            if(post.most_recent_vote()["timestamp"]>mostRecentVoteTimestamp) {
                // console.log("\t setting new top post on time");
                topPost = post;
                topPostScore = postScore;
                mostRecentVoteTimestamp = post.most_recent_vote()["timestamp"];
            }
        }
    });
    
    var outputId = null;
    if(topPost != null && topPostScore > 1) {
        logger.info("Found top post, id " + topPost.id + " w/ score " + topPostScore);
        outputId = topPost.id;
    } 
    
    io.sockets.emit("post.hot", {id:outputId});
}


/******       REDIS SETUP        ******/
client.on("error", function(err) {
    logger.error("ERR REDIS: " + err);
});

// On ready, do some things. 
client.once("ready", function(err) {
    logger.info("Connected to redis.");
    
    // set the database.
    if(program.database) {
        if(program.database == parseInt(program.database)) {
            client.select(program.database, function() {
                logger.info("Selected database " + program.database);
                
               loadStateFromRedis();
            });
        }
    } else {
        loadStateFromRedis();
    }
    
    
    
    // TODO technically, we should block other startup binding until this is
    // done. 
    
    setTimeout(processHotPosts, 5000, true);
});

function loadStateFromRedis() {
    
    logger.info("Loading state from redis.");
    
    // Load in all the models from Redis.
    client.get("global:nextUserId", function(err, nextUserId) {
        client.get("global:nextPostId", function(err, nextPostId){
            model.initNextIds(nextUserId, nextPostId);
        });
    });
    
    
    client.hgetall("users", function(err, users) {
        for(id in users) {
            logger.debug("processing user: " + id);
            var userParams = users[id];
            logger.debug("with data: "
                + userParams);

            user = new model.ServerUser(JSON.parse(userParams));
            allUsers.add(user);
        }

        logger.info("Loaded " + allUsers.length + " users.");
    });
    
    client.hgetall("posts", function(err, posts) {
        for(id in posts) {
            var postParams = posts[id];
            
            post = new model.ServerPost(JSON.parse(postParams));
            allPosts.add(post);
        }
        
        logger.info("Loaded " + allPosts.length + " posts.");
    });
    
}
