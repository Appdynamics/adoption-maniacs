var log4js 			= require('log4js');
var log 			= log4js.getLogger("testRestManager");
var assert    		= require("chai").assert;
var mgr	= require("../../src/RestManager.js");

describe("Unit test of authentication", function() {
	
    it('Test Authentication - Sample 1', function (done) {
        var appSession = mgr.buildNewAppSession("https://test.saas.appdynamics.com","customer1","testuser","Password");
        assert.equal("test.saas.appdynamics.com",appSession.getController());
        assert.equal(true,appSession.isHttps());
        assert.equal(443,appSession.getPort());
        assert.equal("Basic dGVzdHVzZXJAY3VzdG9tZXIxOlBhc3N3b3Jk",appSession.getAuthString());
        //console.log(appSession.getAuthString());
        done();
    });

    it('Test Authentication - Sample 2', function (done) {
        var appSession = mgr.buildNewAppSession("http://test.saas.appdynamics.com:8090","customer1","testuser","Password");
        assert.equal(false,appSession.isHttps());
        assert.equal(8090,appSession.getPort());
        done();
    });

    it('Test Authentication - Sample 3', function (done) {
        var appSession = mgr.buildNewAppSession("https://test.saas.appdynamics.com:8090","customer1","testuser","Password");
        assert.equal(true,appSession.isHttps());
        assert.equal(8090,appSession.getPort());
        done();
    });

    it('Test Authentication - isAuthenticated', function (done) {
        var appSession = mgr.buildNewAppSession("https://test.saas.appdynamics.com:8090","customer1","testuser","Password");
        assert.equal(false,appSession.isAuthenticated());
        appSession.setCSRFToken("test");
        assert.equal(true,appSession.isAuthenticated());
        done();
    });


});