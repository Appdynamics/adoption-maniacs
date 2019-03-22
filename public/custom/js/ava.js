
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

var avaAudioElement;
function avaPlayAudio(uistep) {
    return new Promise(function (success, error) {
        if(avaAudioElement == null){
            avaAudioElement = document.createElement('audio');
            avaAudioElement.setAttribute("id", "_avaAudio");
            avaAudioElement.setAttribute("muted","true");
            document.body.appendChild(avaAudioElement);
        }
        avaAudioElement.addEventListener("ended", function () {
            uistep.played = true;
            success();
        });
        try{
            if(!uistep.played){
                avaAudioElement.src = "/audio/"+uistep.audio+".mp3";
                avaAudioElement.play();
            }
        }catch(e){
            //do nothing
        }
    });
}

class UIStep {
    constructor(step,audio,action,func) {
        this.step = step;
        this.audio = audio;
        this.func = func;
        if(action == null){
            this.action = "after";
        }else{
            this.action = action;
        }
    }
    isAfter(){
        return this.action == "after";
    }
    isBefore(){
        return this.action == "before";
    }
    run(){
        this.func();
    }
    reset(){
        this.played = false;
    }

    listen(id,callback,wait){
        var uistep = this;
        $(id).on('click', function(e){
            e.stopPropagation();
            playScript(uistep,callback,wait);
        });
    }
}

function playScript(script,callback,wait){
    playScripts([script],callback,wait);
}

function playScripts(scripts,callback,wait){
    _playScripts(scripts,0,callback,wait);
}

function isFunction(functionToCheck) {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

function _playScripts(script,i,callback,wait){
    if(script.length > i){
        var uistep = script[i];
        impress().goto(uistep.step);
        if(uistep.isBefore()){
            if (isFunction(uistep.func)){
                uistep.run();
            }
        }
        if(uistep.audio){
            avaPlayAudio(uistep).then(function(){
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
        script.length = 0;
        if(callback){
            callback();
        }
    }
}

