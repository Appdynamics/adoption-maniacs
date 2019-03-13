var assert    		= require("chai").assert;
var avaManager	= require("../../src/AVAManager");

describe("Functional tests of AVAManager.js", function() {
    it('Test init sound files', function (done) {
        avaManager.buildSoundFiles();
        done();
    });
});