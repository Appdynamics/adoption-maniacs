var assert    		= require("chai").assert;
var aprManager  	= require("../src/APRManager.js");
var mgr	= require("../src/RestManager.js");
var apr	= require("../public/custom/js/apr-analysis.js");
var testHistogramSnapshotsData = require("./health/testHistogramSnapshots-2.json");

describe("Functional tests of health.js", function() {
    // it('Test analyzeSnapshots - Errors', function (done) {
    //     var results = health.analyzeErrorSnapshots({id:15,name:"test"},testHistogramSnapshotsData,5);
    //     //console.log(JSON.stringify(results));
    //     done();
    // });

    it('Test analyzeSnapshots - VERY SLOW', function (done) {
        var results = apr.analyzeSnapshotsGetCategories({id:15,name:"test"},testHistogramSnapshotsData);
        console.log(JSON.stringify(results));

        var verySlow = apr.extractSnapshotsWithDiagnostics("VERY_SLOW",testHistogramSnapshotsData,true)
        //console.log(JSON.stringify(verySlow));
        //console.log(verySlow.length);

        var slow = apr.extractSnapshotsWithDiagnostics("SLOW",testHistogramSnapshotsData,true)
        //console.log(JSON.stringify(slow));
        //console.log(slow);

       

        // var query = "snapshot/potentialProblems?request-guid=59e6057e-d36c-4647-ba90-1041a1b13870&applicationId=8977&time-range=Custom_Time_Range.BETWEEN_TIMES.1540321946557.1540318346557.60&max-problems=50&max-rsds=30&exe-time-threshold=5";
        // mgr.makeInternalCall(query,function(err,response){
        //     //console.log(JSON.stringify(response));
        //     //done();
        // })

        aprManager.potentialIssues(verySlow).then(function (results) {
            var str = JSON.stringify(results);
            console.log(str);
            done();
        });


        //done();
    });

});