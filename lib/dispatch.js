var   model = require('./server-model.js')
    , _ = require('underscore')._
    , winston = require('winston');


var logger= new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            filename:'dispatch.log',
            timestamp:true,
            levels:winston.syslog,
            json:false,
            })
    ]
});

_.extend(model, require('../static/js/model.js'));

dispatch = exports;

// The BroadcastDispatcher is a really basic dispatcher that
// spreads posts by broadcasting them to everyone in the event immediately.
// There's no notion of promotion or anything here, all messages are basically
// insta-promoted. This works only in cases with very low post load. Low user
// count is probably also useful.
dispatch.BroadcastDispatcher = function() {
    
}

dispatch.BroadcastDispatcher.prototype = {
    
    
    
}

// SpreadingDispatcher is tricky dispatcher that follows a heuristic for 
// promoting posts. When a new post comes in, dispatch it to N people.
// Whenever we get a vote from those people, spread to another M people.
// On each vote, the dispatcher calculates a rank ordering of all the posts
// based on score. If a post is now in the top (8?) posts, promote it and
// publish it to everyone. 

dispatch.SpreadingDispatcher = function() {
    
}

dispatch.SpreadingDispatcher.prototype = {
    
    
    
    
    
}
