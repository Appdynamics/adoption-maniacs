
var buildScoreCardTable = function(topX,scoreCardResults,divId){
    
    scoreCardResults.forEach(function(score){
        score[0] = aprformatMessage(score[0],50);
    });


    new Table({
        targetId:divId,
        data:scoreCardResults,
        order: [[ 1, "desc" ]],
        columns: [{ title: "Business Transaction" },{ title: "Calls" },{ title: "ART(ms)" },{ title: "Error %" },{ title: "Slow %" },{ title: "Very Slow %" },{ title: "Stall %" }],
        options : {
            "searching": false,
            "paging": false,
            "ordering": true,
            "info": false
        }
    }).draw(function(row){
        
    });	
}

var avaa_buildBTDashboard = function(appId,topX,timeRange,divId,callback){
    analyzeBTs(appId,topX,timeRange,"TopBTsByErrors",function(bts,results){
        buildScoreCardTable(topX,results,divId);
        callback(bts,results);
        //buildScoreCards(appId,timeRange,bts);
    });
}

var extractPotentialIssues = function(issues){
    var results = [];
    issues.forEach(function(issue){
        results.push([issue.executionTimeMs,aprformatMessage(issue.message,100)]);
    });
    return results;
}

var displayPotentialIssues= function(bt,div,title,potentialIssues){
    new Table({
        targetId:div,
        title:title,
        data:potentialIssues,
        order: [[ 0, "desc" ]],
        columns: [{ title: "Time Spent (ms)" },{ title: "Potential Problems" }],
        options : {
            "searching": false,
            "paging": false,
            "ordering": true,
            "info": false
        }
    }).draw(function(row){
        
    });	
}

