
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
            "info": false,
            columnDefs: [
                {
                    "targets": [ 6 ],
                    "visible": false
                }
            ]
        },
        class:"table table-borderless table-striped table-earning"
        
    }).draw(function(row){
        alert(JSON.stringify(row));
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
            "info": false,
            
        },
        class:"table table-borderless table-striped table-earning"
    }).draw(function(row){
        
    });	
}

function playScript(script,i,callback,wait){
    if(script.length > i){
        var uistep = script[i];
        if(uistep.isBefore()){
            if (isFunction(uistep.func)){
                uistep.run();
            }
        }
        if(uistep.text){
            ava.SpeakWithPromise(uistep.text).then(function(){
                if(uistep.isAfter()){
                    if (isFunction(uistep.func)){
                        uistep.run();
                    }
                }
                if(wait){
                    setTimeout(function(){
						playScript(script,i+1,callback,wait);
					}, wait );
                }else{
                    playScript(script,i+1,callback);
                }
            });
        }
    }else{
        if(callback){
            callback();
        }
    }
}

