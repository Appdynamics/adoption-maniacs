function aprformatMessage(str,stringLength) {
  var ret = [];
  var i;
  var len;

  for(i = 0, len = str.length; i < len; i += stringLength) {
    ret.push(str.substr(i, stringLength))
    ret.push("\n");
  }

  var stringResult = "";
  for(i=0, len = ret.length; i<len; i++){
    stringResult += ret[i];
  }

  return stringResult;
};


class ScoreCardChart extends TimeChart {
  constructor(options) {
    super(options);
  }

  renderGraph(dataKey, data, clickFunction) {
    var chartOptions = {
      bindto: super.getDiv(),
      data: {
        x: "dates",
        types: {
          "Avg Resp(ms)": "line",
          "Max Resp(ms)": "line",
          NORMAL: "bar",
          SLOW: "bar",
          VERY_SLOW: "bar",
          STALL: "bar",
          ERROR: "bar"
        },
        columns: data,
        onclick: function(e) {
          var date = new Date(e.x.getTime());
          if (clickFunction) {
            clickFunction({ id: e.id, date: date });
          }
        },
        axes: {
          "Avg Resp(ms)": "y2",
          "Max Resp(ms)": "y2",
          NORMAL: "y",
          SLOW: "y",
          VERY_SLOW: "y",
          STALL: "y",
          ERROR: "y"
        },
        order: null,
        colors: {
          "Avg Resp(ms)": "blue",
          "Max Resp(ms)": "red",
          NORMAL: "lawngreen",
          SLOW: "sandybrown",
          VERY_SLOW: "darkorange",
          STALL: "mediumpurple",
          ERROR: "tomato"
        },
        groups: [["VERY_SLOW", "SLOW", "STALL", "ERROR", "NORMAL"]]
      },
      bar: {
        width: {
          ratio: 0.15
        }
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
            format: "%m/%d %H:%M",
            fit: false
          }
        },
        y2: {
          show: true,
          label: "Response Times (ms)",
          position: "outer-middle"
        },
        y: {
          show: true,
          label: "Count",
          position: "outer-middle"
        }
      }
    };
    super.updateChartOptions(chartOptions);
    debug(this, JSON.stringify(chartOptions));
    this.chart = c3.generate(chartOptions);
  }
}

class ScoreCardComponent extends BaseComponent {
  constructor(options) {
    if (!options.template) {
      options.template = _noPanelComponentTemplate;
    }
    super(options, new ScoreCardChart(options));
  }
}

class ReportSelectionComponent extends BaseComponent {
  constructor(options) {
    options.template = "#_ReportSelectionTemplate";
    super(options);
  }

  getValues(){
    return {
      timerange_text : $( "#_ReportTimeRange option:selected" ).text(),
      timerange_value : $( "#_ReportTimeRange option:selected" ).val(),
      application_name : $( "#_ReportApplication option:selected" ).text(),
      application_id : $( "#_ReportApplication option:selected" ).val(),
      topx : $( "#_ReportTopX option:selected" ).val(),
    };
  }

  draw(onClick, callback) {
    var options = this.getOptions();
    this.template = $.templates(options.template);
    var html = this.template.render(options);
    $("#" + options.targetId).html(html);
    $("#_ReportSelectionRun").on("click", function() {
      if (onClick) {
        onClick({
          timerange_text : $( "#_ReportTimeRange option:selected" ).text(),
          timerange_value : $( "#_ReportTimeRange option:selected" ).val(),
          application_name : $( "#_ReportApplication option:selected" ).text(),
          application_id : $( "#_ReportApplication option:selected" ).val(),
          topx : $( "#_ReportTopX option:selected" ).val(),
          report: $("#_ReportName").val()
        });
      }
    });

    if (callback) {
      callback(options);
    }
  }
}

class ReportV2SelectionComponent extends BaseComponent {
  constructor(options) {
    options.template = "#_ReportV2SelectionTemplate";
    super(options);
  }

  getValues(){
    return {
      timerange_text : $( "#_ReportTimeRange option:selected" ).text(),
      timerange_value : $( "#_ReportTimeRange option:selected" ).val(),
      application_name : $( "#_ReportApplication option:selected" ).text(),
      application_id : $( "#_ReportApplication option:selected" ).val(),
      topx : $( "#_ReportTopX option:selected" ).val(),
    };
  }

  draw(onClick, callback) {
    var options = this.getOptions();
    this.template = $.templates(options.template);
    var html = this.template.render(options);
    $("#" + options.targetId).html(html);
    $("#_ReportSelectionRun").on("click", function() {
      if (onClick) {
        onClick({
          timerange_text : $( "#_ReportTimeRange option:selected" ).text(),
          timerange_value : $( "#_ReportTimeRange option:selected" ).val(),
          application_name : $( "#_ReportApplication option:selected" ).text(),
          application_id : $( "#_ReportApplication option:selected" ).val(),
          topx : $( "#_ReportTopX option:selected" ).val(),
          report: $("#_ReportName").val()
        });
      }
    });

    if (callback) {
      callback(options);
    }
  }
}


var drawTransScoreCard = function(timeRange,bt,targetId) {
  var query =
    "histogram/txScoreChartData/BUSINESS_TRANSACTION/" + bt.id+"?time-range="+timeRange+"&baseline=-1";
  searchControllerRestUI(query, function(results) {
    var btBreakOutAPI = new BTBreakOutAPI();
    var columns = btBreakOutAPI.formatHistogramToColumnData(results);
    new ScoreCardComponent({
      targetId: targetId,
      title: bt.name+" Business Transaction Score Card",
      dataKey: "raw_columns",
      data: columns,
      options:{size:{width:"800"}}
    }).draw();
  });
};

buildPotentialIssuesQuery = function(snapshot) {
  var startTime = snapshot.serverStartTime;
  var endTime = startTime - 3600000;

  var url =
    "snapshot/potentialProblems?request-guid=" +
    snapshot.requestGUID +
    "&applicationId=" +
    snapshot.applicationId +
    "&time-range=Custom_Time_Range.BETWEEN_TIMES." +
    startTime +
    "." +
    endTime +
    ".60" +
    "&max-problems=5&max-rsds=30&exe-time-threshold=5";
  return url;
};

var analyzeSnapshots = function(
  appid,
  bt,
  topX,script,
  errorSnapshotsCallback,
  verySlowCallback,
  slowCallBack
) {
  var query = "histogram/snapshotsHistogramData";
  var request = {
    firstInChain: true,
    maxRows: 600,
    applicationIds: [appid],
    businessTransactionIds: [bt.id],
    rangeSpecifier: { type: "BEFORE_NOW", durationInMinutes: 60 }
  };
  postControllerRestUI(
    { query: query, options: JSON.stringify(request) },
    function(results) {
      var btBreakOutAPI = new BTBreakOutAPI();
      if (errorSnapshotsCallback) {
        var errorResults = btBreakOutAPI.analyzeErrorSnapshots(
          bt,
          results,
          topX
        );
        errorSnapshotsCallback(script,bt, errorResults);
      }
      if (verySlowCallback) {
        var diagResults = btBreakOutAPI.extractSnapshotsWithDiagnostics(
          "VERY_SLOW",
          results,
          true
        );
        if (diagResults.length > 0) {
          //just take 1 VERY_SLOW snapshot to get potential issues
          var query = buildPotentialIssuesQuery(diagResults[0]);
          searchControllerRestUI(query, function(issues) {
            verySlowCallback(script,bt, issues);
          });
          //if we get Very Slow then do not bother with Slow.
          return;
        }
      }
      if (slowCallBack) {
        var diagResults = btBreakOutAPI.extractSnapshotsWithDiagnostics(
          "SLOW",
          results,
          true
        );
        if (diagResults.length > 0) {
          //just take 1 SLOW snapshot to get potential issues
          var query = buildPotentialIssuesQuery(diagResults[0]);
          searchControllerRestUI(query, function(issues) {
            slowCallBack(script,bt, issues);
          });
        }
      }
    }
  );
};

var zeroOut = function(value){
  if(value && value < 0){
    return 0;
  }else{
    return value;
  }
}

var listBTs = function(appid, timeRange, callback){
  var query =
    "bt/list/" + appid + "?time-range="+timeRange;
  var results = [];
  searchControllerRestUI(query, function(bts) {
    bts.forEach(bt => {
      results.push([
        bt.id,
        bt.name,
        zeroOut(bt.callsPerMinute),
        zeroOut(bt.averageResponseTime),
        zeroOut(bt.errorPercentage),
        zeroOut(bt.slowPercentage),
        zeroOut(bt.extremelySlowPercentage),
        zeroOut(bt.stallsPercentage)
      ]);
    });
    callback(results);
  });
}


var analyzeBTs = function(appid, topX, timeRange, report , callback) {
  var query =
    "bt/list/" + appid + "?time-range="+timeRange;
  searchControllerRestUI(query, function(results) {
    var btBreakOutAPI = new BTBreakOutAPI();
    var bts;
    var order = 1;
    if(report == "TopBTsByCalls"){
      bts = btBreakOutAPI.topBTsByCalls(results, topX);
      order = 1;
    }
    if(report == "TopBTsByResponse"){
      bts = btBreakOutAPI.topBTsByResponse(results, topX);
      order = 2;
    }
    if(report == "TopBTsByErrors"){
      bts = btBreakOutAPI.topBTsByErrors(results, topX);
      order = 3;
    }

    var results = [];
    bts.forEach(bt => {
      results.push([
        bt.name,
        bt.callsPerMinute,
        bt.averageResponseTime,
        bt.errorPercentage,
        bt.slowPercentage,
        bt.extremelySlowPercentage,
        bt.stallsPercentage
      ]);
    });

    callback(bts, results,order);
  });
};


var getTimeRangeBasedOnFilter = function(selection){
  switch(selection){
      case 'last_1_hour.BEFORE_NOW.-1.-1.60' : return '1h';
      case 'last_6_hours.BEFORE_NOW.-1.-1.360' : return '6h';
      case 'last_12_hours.BEFORE_NOW.-1.-1.720' : return '12h';
      case 'last_1_day.BEFORE_NOW.-1.-1.1440' : return '1d';
      case 'last_3_days.BEFORE_NOW.-1.-1.4320' : return '3d';
      case 'last_1_week.BEFORE_NOW.-1.-1.10080' : return '1w';
      case 'last_2_week.BEFORE_NOW.-1.-1.20160' : return '2w';
  }
}

var pushResults = function(results,element,property){
  if(element[property] && element[property].value){
    results.push(element[property].value);
  }else{
    results.push(0);
  }
}

var remoteServices = function(appid,topX,timeRange,callback){
    var period = getTimeRangeBasedOnFilter(timeRange);
    var times = getTimeRangeBasedOnSelection(period);
    var parms = {"requestFilter":{"queryParams":{"applicationId":appid},"filters":[]},"resultColumns":["NAME","TYPE", "RESPONSE_TIME", "CALLS_PER_MIN", "ERRORS_PER_MIN"],"offset":0,"limit":-1,"searchFilters":[],"columnSorts":[{"column":"CALLS","direction":"DESC"}],"timeRangeStart":times.start,"timeRangeEnd":times.end};
    var query = "backend/list/remoteService";
    postControllerRestUI({ query: query, options: JSON.stringify(parms) },function(results){

      var data = results.data;
      var tableResults = [];
      data.forEach(function(service){
        var serviceResults = [];
        serviceResults.push(service.exitPointSubtype);
        serviceResults.push(aprformatMessage(service.name,50));

        pushResults(serviceResults,service.performanceStats,"averageResponseTime");
        pushResults(serviceResults,service.performanceStats,"callsPerMinute");
        pushResults(serviceResults,service.performanceStats,"errorsPerMinute");

        tableResults.push(serviceResults);
      })

      callback({data:tableResults.splice(0,topX),count:results.totalCount});
    });

}

var dbQueries = function(topX,timeRange,callback){
  var period = getTimeRangeBasedOnFilter(timeRange);
  var times = getTimeRangeBasedOnSelection(period);
  var parms = {topX:topX,start:times.start,end:times.end};
  var query = "dbQueries";
  postControllerRestUI({ query: query, options: JSON.stringify(parms) },function(results){
    callback(results);    
  });
}

var recommend = function(id){
  var html = $("#"+id).html();
  $("#"+id).append("<div>"+
    "<textarea id='"+id+"-text'>"+html+"</textarea></div>"+
    " <button type=\"submit\" class=\"btn btn-primary\" onClick=\"applyRecommendation('"+id+"');\">Apply</button>"+
    " <button type=\"submit\" class=\"btn btn-success\" onClick=\"responseTimesRecommendation('"+id+"');\">Response Times</button>"+
    " <button type=\"submit\" class=\"btn btn-warning\" onClick=\"slowRecommendation('"+id+"');\">Slow</button>"+
    " <button type=\"submit\" class=\"btn btn-warning\" onClick=\"verySlowRecommendation('"+id+"');\">Very Slow</button>"+
    " <button type=\"submit\" class=\"btn btn-secondary\" onClick=\"stallRecommendation('"+id+"');\">Stalls</button>"+
    " <button type=\"submit\" class=\"btn btn-danger\" onClick=\"errorRecommendation('"+id+"');\">Errors</button>"+
    " <button type=\"submit\" class=\"btn btn-primary\" onClick=\"remoteRecommendation('"+id+"');\">Remote</button>"+
    " <button type=\"submit\" class=\"btn btn-warning\" onClick=\"dbRecommendation('"+id+"');\">DB</button>"+
    " <button type=\"submit\" class=\"btn btn-primary\" onClick=\"clearRecommendation('"+id+"');\">Clear</button>"
  );
  $("#"+id+"-text").jqte();
}

var getRecommendation = function(id){
  return $("#"+id+"-text").val();
}

var setRecommendation = function(id,recommendation){
  $("#"+id+"-text").jqteVal(recommendation);
}

var addRecommendation = function(id,recommendation){
  var text = getRecommendation(id);
  text = text + "<br/>"+recommendation;
  $("#"+id+"-text").jqteVal(text);
}

var applyRecommendation = function(id){
  $("#"+id).html(getRecommendation(id));
}

var responseTemplate = $.templates("#recommendation_response");
var responseTimesRecommendation = function(id){
  var recommendation = responseTemplate.render({});
  addRecommendation(id,recommendation);
}

var slowTemplate = $.templates("#recommendation_slow");
var slowRecommendation = function(id){
  addRecommendation(id,slowTemplate.render());
}

var verySlowTemplate = $.templates("#recommendation_very");
var verySlowRecommendation = function(id){
  addRecommendation(id,verySlowTemplate.render());
}

var stallTemplate = $.templates("#recommendation_stall");
var stallRecommendation = function(id){
  addRecommendation(id,stallTemplate.render());
}

var errorTemplate = $.templates("#recommendation_errors");
var errorRecommendation = function(id){
  addRecommendation(id,errorTemplate.render());
}

var remoteTemplate = $.templates("#recommendation_remote");
var remoteRecommendation = function(id){
  addRecommendation(id,remoteTemplate.render());
}

var dbTemplate = $.templates("#recommendation_db");
var dbRecommendation = function(id){
  addRecommendation(id,dbTemplate.render());
}

var clearRecommendation = function(id){
  setRecommendation(id,"");
}