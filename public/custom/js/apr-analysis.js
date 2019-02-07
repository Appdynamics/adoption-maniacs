var _prop_callsPerMinute = "callsPerMinute";
var _prop_averageResponseTime = "averageResponseTime";
var _prop_numberOfErrors = "numberOfErrors";

class BTBreakOutAPI {
    constructor(){
    }
    
    sortArray(btlist,prop) {
        btlist.sort(function(rec1,rec2){
            return rec2[prop] - rec1[prop];
        });
        return btlist;
    }
    
    topBTsByCalls(btlist,topX){
        var sortedArray = this.sortArray(btlist,_prop_callsPerMinute);
        return sortedArray.splice(0,topX,"asc");
    }

    topBTsByResponse(btlist,topX){
        var sortedArray = this.sortArray(btlist,_prop_averageResponseTime);
        return sortedArray.splice(0,topX,"asc");
    }

    topBTsByErrors(btlist,topX){
        var sortedArray = this.sortArray(btlist,_prop_numberOfErrors);
        return sortedArray.splice(0,topX,"asc");
    }

    findMaxIssue(bt){
        var metrics = [];
        metrics.push(["slowPercentage",bt.slowPercentage]);
        metrics.push(["extremelySlowPercentage",bt.extremelySlowPercentage]);
        metrics.push(["stallsPercentage",bt.stallsPercentage]);
        metrics.push(["errorPercentage",bt.errorPercentage]);
        metrics.sort(function(rec1,rec2){
            return rec2[1] - rec1[1];
        });
        return {issue:metrics[0][0],value:metrics[0][1]};
    }

    captureColumnData(prop,field,histogramData){
        var dataset = histogramData[prop];
        var results = [prop];
        dataset.dataTimeslices.forEach(function(rec){
            if(rec.metricValue && rec.metricValue[field]){
                results.push(rec.metricValue[field]);
            }else{
                if(!rec.metricValue){
                    //console.log(JSON.stringify(rec));
                    results.push(0);
                }else{
                    results.push(0);
                }
            }
        });
        return results;
    }

    captureTimeData(prop,histogramData){
        var dataset = histogramData[prop];
        var results = [prop];
        dataset.dataTimeslices.forEach(function(rec){
            if(rec.startTime){
                results.push(rec.startTime);
            }else{
                results.push(0);
            }
        });
        return results;
    }

    formatHistogramToColumnData(histogramData){
        var normal = this.captureColumnData("NORMAL","value",histogramData.histogramDataMap);
        var slow = this.captureColumnData("SLOW","value",histogramData.histogramDataMap);
        var veryslow = this.captureColumnData("VERY_SLOW","value",histogramData.histogramDataMap);
        var stall = this.captureColumnData("STALL","value",histogramData.histogramDataMap);
        var error = this.captureColumnData("ERROR","value",histogramData.histogramDataMap);
        var averageTimes = this.captureColumnData("averageResponseTimeData","value",histogramData);
        averageTimes[0] = "Avg Resp(ms)";
        var maxTimes = this.captureColumnData("averageResponseTimeData","max",histogramData);
        maxTimes[0] = "Max Resp(ms)";
        var times = this.captureTimeData("NORMAL",histogramData.histogramDataMap);
        times[0] ="dates";
        return [times,averageTimes,maxTimes,normal,error,slow,veryslow,stall];
    }

    getCategories(){
        return ["VERY_SLOW","SLOW","STALL","ERROR","NORMAL"];
    }


    extractSnapshotsWithDiagnostics(experience,histogramSnapshotData,returnDiagInfo){
        var results = [];
        var snapshots = histogramSnapshotData.rsdQueryResult.requestSegmentDataListItems;
        snapshots.forEach(function(snapshot){
            if(snapshot.userExperience == experience){
                if(returnDiagInfo){
                    var diag = {id:snapshot.id,applicationId:snapshot.applicationId,userExperience:snapshot.userExperience,serverStartTime:snapshot.serverStartTime,
                        requestGUID:snapshot.requestGUID,diagnosticSessionGUID:snapshot.diagnosticSessionGUID};
                    results.push( diag );
                }else{
                    results.push(snapshot);
                }
            }
        });
        return results;
    }

    analyzeSnapshotsGetCategories(bt,histogramData){
        var snapshotTypes = {}
        var snapshots = histogramData.rsdQueryResult.requestSegmentDataListItems;
        snapshots.forEach(function(snapshot){
            var experience = snapshot.userExperience;
            if(snapshotTypes[experience]){
                var count = snapshotTypes[experience];
                snapshotTypes[experience] = count + 1;
            }else{
                snapshotTypes[experience] = 1;
            }
        });
        return snapshotTypes;
    }

    analyzeErrorSnapshots(bt,histogramData,topX){
        var results = [];
        var errors = {};
        var snapShotErrors = {};
        var snapshots = histogramData.rsdQueryResult.requestSegmentDataListItems;
        snapshots.forEach(function(snapshot){
            if(snapshot.userExperience == "ERROR"){
                var summary = snapshot.summary;
                var match = summary.indexOf("[Error]");
                if(match >= 0){
                    if(errors[summary]){
                        var count = errors[summary];
                        errors[summary] = count + 1;
                    }else{
                        errors[summary] = 1;
                    }
                }else{
                    if(snapShotErrors[summary]){
                        var count = snapShotErrors[summary];
                        snapShotErrors[summary] = count + 1;
                    }else{
                        snapShotErrors[summary] = 1;
                    }
                }
            }
        });

        //console.log("BT : "+bt.id+" : "+bt.name);
        var results = [];
        for(var key in errors){
            results.push({error:key,count:errors[key]});
        }
        //console.log("Errors : "+JSON.stringify(errors));
        if(results.length == 0){
            for(var key in snapShotErrors){
                results.push({error:key,count:snapShotErrors[key]});
            }
        }
        //console.log("Snapshot Errors : "+JSON.stringify(snapShotErrors));
        var sortedArray = this.sortArray(results,"count");
        var topXResults = sortedArray.splice(0,topX,"desc");

        //console.log("topXResults : "+JSON.stringify(topXResults));
        return topXResults;
    }
}

try{
    if(exports){
        exports.btBreakOut  = new BTBreakOutAPI();
        exports.topBTsByCalls  = exports.btBreakOut.topBTsByCalls;
        exports.sortArray  = exports.btBreakOut.sortArray;
        exports.findMaxIssue  = exports.btBreakOut.findMaxIssue;
        exports.formatHistogramToColumnData = exports.btBreakOut.formatHistogramToColumnData;
        exports.captureColumnData = exports.btBreakOut.captureColumnData;
        exports.captureTimeData = exports.btBreakOut.captureTimeData;
        exports.getCategories = exports.btBreakOut.getCategories;
        exports.analyzeErrorSnapshots = exports.btBreakOut.analyzeErrorSnapshots;
        exports.analyzeSnapshotsGetCategories = exports.btBreakOut.analyzeSnapshotsGetCategories
        exports.extractSnapshotsWithDiagnostics = exports.btBreakOut.extractSnapshotsWithDiagnostics;
        exports.extractDiagInfo = exports.btBreakOut.extractDiagInfo;
    }
}catch(error){
    // console.log(error);
}


  