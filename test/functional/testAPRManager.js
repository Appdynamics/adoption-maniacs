var assert    		= require("chai").assert;
var aprManager	= require("../../src/APRManager");
var restManager	= require("../../src/RestManager");

describe("Functional tests of APRManager.js", function() {
    it('Test Database List', function (done) {
        var parms = {"topX":"5","start":1541605680000,"end":1541609339999};
        aprManager.topDBQueries(restManager,parms.topX,parms.start,parms.end).then(function(results){
            console.log(JSON.stringify(results));
            done();
        });
    });
    
});