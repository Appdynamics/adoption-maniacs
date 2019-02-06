var log4js 			= require('log4js');
var log 			= log4js.getLogger("testRestManager");
var assert    		= require("chai").assert;
var mgr	= require("../../src/RestManager.js");

describe("Unit test of authentication", function() {
	
    it('Test Functional Authentication ', function (done) {
        var appSession = mgr.buildNewAppSession("https://test.saas.appdynamics.com","","","");
        mgr.authenticate(appSession,function(err,success){
            if(success){
                console.log("authenticated");
            }else{
                console.log(err);
            }
            done();
        })
    });

});