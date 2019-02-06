var assert    		= require("chai").assert;
var apr	= require("../public/custom/js/apr-analysis.js");
var sinon = require("sinon");
var testBTs = require("./health/testbts.json");
var testHistogramData = require("./health/testHistogram.json");

describe("Functional tests of health.js", function() {
    it('Test topBTsByCalls', function (done) {
        var shortDesc = "";
        var results = apr.topBTsByCalls(testBTs,5);
        for (let index = 0; index < results.length; index++) {
            const bt = results[index];
            shortDesc += bt.name+"-"+bt.callsPerMinute;
        }
        //console.log(shortDesc);
        assert.equal("BT3-99BT19-72BT6-47BT1-26BT5-20",shortDesc);
        done();
    });

    it('Test findMaxIssue : case 1', function (done) {
        var bt = {
            "slowPercentage": 0,
            "extremelySlowPercentage": 0.1,
            "stallsPercentage": 0,
            "errorPercentage": 96.5
        }
        var maxIssue = apr.findMaxIssue(bt);
        assert.equal("errorPercentage",maxIssue.issue);

        bt["errorPercentage"]=10;
        bt["slowPercentage"]=30;
        maxIssue = apr.findMaxIssue(bt);
        assert.equal("slowPercentage",maxIssue.issue);

        done();
    });

    it('Test formatHistorgramToColumnData : case 1', function (done) {
        var results  = apr.formatHistogramToColumnData(testHistogramData);
        //assert we get the 5 groups.
        assert.equal(7,results.length);
        done();
    });
    
});