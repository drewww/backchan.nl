var should = require('should'),
    server = require('../lib/server.js');

describe('server', function(){
    
    // This test is temporarily disabled because I don't have a way to shut
    // down the server. For now, all server tests are happening in
    // test.client.js 
    it('should start up without errors', function(done){
        
        var s = new server.BackchannlServer();
        
        s.bind("started", function() {
            s.stop();
        });
        
        s.bind("stopped", function() {
        setTimeout(done, 10);
        });
        
        s.start("localhost",8888);
    });
});