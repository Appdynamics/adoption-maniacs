var log4js 			= require('log4js');
var log 			= log4js.getLogger("testRestManager");
var assert    		= require("chai").assert;
var mgr	= require("../src/RestManager.js");

describe("Functional test of querying internal ui", function() {
	// it('Test Query', function (done) {
    //     var query = "/bt/list/8977?time-range=last_3_days.BEFORE_NOW.-1.-1.4320";
    //     mgr.makeInternalCall(query,function(err,response){
    //         console.log(JSON.stringify(response));
    //         done();
    //     })
    // });

    // it('Test Query', function (done) {
        
    //     var query = "histogram/snapshotsHistogramData";
    //     var request = 
    //         {"firstInChain":true,"maxRows":600,"applicationIds":[8977],
    //         "businessTransactionIds":[831681],
    //         "rangeSpecifier":{"type":"BEFORE_NOW","durationInMinutes":60}}
       
    //     mgr.makeInternalPostCall(query,request,function(err,response){
    //         console.log(JSON.stringify(response));
    //         done();
    //     })
    // });

    it('Test Query', function (done) {
        
        //var query = "snapshot/potentialProblems?request-guid=59e6057e-d36c-4647-ba90-1041a1b13870&applicationId=8977&time-range=Custom_Time_Range.BETWEEN_TIMES.1540321946557.1540318346557.60&max-problems=50&max-rsds=30&exe-time-threshold=5";
        //var query = "snapshot/potentialProblems?request-guid=59e6057e-d36c-4647-ba90-1041a1b13870&applicationId=8977&time-range=Custom_Time_Range.BETWEEN_TIMES.1540321946557.1540318346557.60&max-problems=50&max-rsds=30&exe-time-threshold=5";
        var query = "bt/list/29?time-range=last_3_days.BEFORE_NOW.-1.-1.4320"
        mgr.makeInternalCall(null,query,function(err,response){
            console.log(JSON.stringify(response));
            done();
        })
    });
    
});