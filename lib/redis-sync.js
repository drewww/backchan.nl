var _ = require('underscore')._
    Backbone = require('backbone'),
    winston = require('winston'),
    redis = require('redis').createClient();

sync = exports;

var logger= new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            filename:'server.log',
            timestamp:true,
            json:false,
            level: 'debug'
            })
    ],
    levels: winston.config.syslog.levels
});

redis.once("ready", function(err) {
    logger.info("Redis ready for business.");
});

// overriding sync per:
// http://documentcloud.github.com/backbone/#Sync

sync.sync = function(method, model, options) {
    // method – the CRUD method ("create", "read", "update", or "delete")
    // model – the model to be saved (or collection to be read)
    // options – success and error callbacks, and all other jQuery request options
    // basically we can leverage redis' complete lack of caring about 
    // creating things explicitely and jump dump attributes into redis.
    switch(method) {
        case "create":
            
            redis.incr('global:' + model.urlRoot + ".next.id");
            redis.set.call(redis,model.url(),JSON.stringify(model.toJSON()));
            
            options.success && options.success();
            break;
        case "update":
            // we're using the model.url method to generate keys because semantically,
            // this is what .url() is supposed to be for if we were running on the 
            // client and syncing over http.
            redis.set.call(redis,model.url(),JSON.stringify(model.toJSON()));
            options.success && options.success();
            break;
        case "read":
            
            // given a collection, get all its bits.
            redis.keys(model.url() + ".*", function(err, modelKeys) {
                
                redis.mget(modelKeys, function(err, models) {
                    var parsed = _.map(models, function(model) {
                                        return JSON.parse(model);
                                    });
                    return parsed;
                });
            });
            
            break;
        case "delete":
            
            break;
    }
}

// We use the dummySync method as something we can override the built
// in sync method with to do nothing. This is useful when you want to test
// the server with persistence OFF, which most of our tests want to do for
// simplicity. 
sync.dummySync = function(method, model, options) {
    return;
}

sync.flush = function() {
    redis.flushdb();
}