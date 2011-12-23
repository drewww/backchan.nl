var should = require('should'),
    server = require('../lib/server.js');

describe('server', function(){
    it('should start up without errors', function(done){
        server.start("localhost",8888, done);
    });
});