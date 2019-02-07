
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
        callback(results);
        //buildScoreCards(appId,timeRange,bts);
    });
}