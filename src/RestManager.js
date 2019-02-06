var log4js = require('log4js');
var log = log4js.getLogger("RestManager");
var https = require("https");
var http = require("http");
var needle = require("needle");
var fs = require('fs');
var dateHelper = require("./DateHelper");

var HttpsProxyAgent = require('https-proxy-agent');
var HttpProxyAgent  = require('http-proxy-agent');

var configManager = require("./ConfigManager");
var config = configManager.getConfig();

var url = require('url');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

http.debug = 2;
http.globalAgent.maxSockets = 20;
minErrorCode = 400;

var getAuthString = function(){
	return 'Basic '+ new Buffer(config.restuser +":"+ config.restpassword).toString('base64');
}

function isEmpty(str) {
    return (!str || 0 === str.length);
}

var addproxy = function(options){
	var proxy = config.proxy;
	
	if (isEmpty(proxy)){
		return;
	}
	
	if(config.https && proxy){
		var agent = new HttpsProxyAgent(proxy)
		options.agent = agent;
	}
	if(!config.https && proxy){
		var agent = new HttpProxyAgent(proxy)
		options.agent = agent;
	}
}

var fetch = function(controller,url, parentCallBack){

	fetchJSessionID(controller,function(err,response){

		if (err) {
			parentCallBack(err,null);
		}
		else {

			var csrfToken = getCSRFToken(response);
			var str = "";
			
			var options = {
				host : controller,
				port : getPort(),
				method : "GET",
				path : url,
				rejectUnauthorized: false,
				headers : {
					"Cookie" : response.headers['set-cookie'],
					"X-CSRF-TOKEN" : csrfToken,
					"Accept":"application/json"
				}
			};
			
			addproxy(options);

			var callback = function(response) {
				response.on('data', function(chunk) {
					str += chunk;
				});

				response.on('error', function(err) {
					parentCallBack(err,null);
				})

				response.on('end', function() {
					if(config.restdebug){
						log.debug("statusCode :"+response.statusCode);
						log.debug("response :");
						log.debug(str);
					}
					if(response.statusCode >= minErrorCode){
						parentCallBack(str,null);
					}else{
						parentCallBack(null,str);
					}
				});
			}.bind(this)

			if(config.https){
				var req = executeRequest(controller,https,options,callback);
			}else{
				var req = executeRequest(controller,http,options,callback);
			}
		}
	})

}

var logmessage = function(statement){
	if(config.restdebug){
		log.debug(statement);
	}
}

var fetchJSessionID = function(controller,parentCallBack){
	var str = "";
	
	var options = {
		host : controller,
		port : getPort(),
		method : "GET",
		path : "/controller/auth?action=login",
		rejectUnauthorized: false,
		headers : {
			"Authorization" : getAuthString(),
		}
	};
	
	addproxy(options);

	logmessage("fetchJSessionID options :"+JSON.stringify(options));

	var callback = function(response) {
		response.on('data', function(chunk) {
			str += chunk;
		});

		response.on('error', function(err) {
			parentCallBack(err,null);
		})

		response.on('end', function() {
			

			if(response.statusCode >= minErrorCode){
				log.error(response);
				parentCallBack(response,null);
			}else{
				parentCallBack(null,response);
			}
		});
	}.bind(this);

	if(config.https){
		var req = https.request(options,callback).end();
	}else{
		var req = http.request(options,callback).end();
	}
}

var getCSRFToken  = function (response) {
    var rc = response.headers['set-cookie'];
    var csrfToken = null;
    rc.forEach(function( parts ) {
    	parts.split(";").forEach(function(cookieStr){
    		if (cookieStr.indexOf("X-CSRF-TOKEN") >= 0){
    			csrfToken = cookieStr.split("=")[1];
    		}
    	});
    });
    return csrfToken;
}

var executeRequest = function(controller,protocol,options,callback){
	if (config.saml){
		fetchJSessionID(controller,function(err,response){
			var csrfToken = getCSRFToken(response);
			options.headers = {"Cookie" : response.headers['set-cookie'],"X-CSRF-TOKEN" : csrfToken};
			return protocol.request(options, callback).end();
		});
	}
	else {
		logmessage("options :"+JSON.stringify(options));
		return protocol.request(options, callback).end();
	}
}

var getProtocol = function(){
	var url;
	if(config.https){
		url = "https://";
	}else{
		url = "http://";
	}
	return url;
}

var getPort = function(){
	var port = 8080;
	if (config.port){
		port = config.port;
	}else{
		if(config.https){
			port = 443;
		}
	}
	return port;
}

/**
 * API for custom event : https://docs.appdynamics.com/display/PRO41/Use+the+AppDynamics+REST+API#UsetheAppDynamicsRESTAPI-CreateEvents
 * 
 */
exports.postEvent = function (app,metric,dataRecord,callback){
	var postData = {};
	postData.summary = "Metric "+ metric.metricName +" is Trending. Trend Factor is "+dataRecord.factor+" Trend Threshold is "+config.factor_threshold;
	postData.eventtype = "CUSTOM";
	postData.customeventtype = "TREND";
	postData.severity = "ERROR";
	postData.comment = "Metric Path "+metric.metricPath;
	var url = "/controller/rest/applications/"+metric.appid+"/events";
	postJSON(app.controller,url,postData,callback);
}


var post = function(controller,postUrl,postData,contentType,parentCallBack) {

	var url = getProtocol() + controller +":"+getPort()+postUrl;
	var options = {
		  method: 'POST',
		  multipart : true,
		  rejectUnauthorized: false,
		  headers:{
			  'Content-Type': contentType,
			  "Authorization" : getAuthString()
		  }
	};

	addproxy(options);

	if(!postData.file){
		postData = {body:postData};
	}
	needle.post(url, postData, options, function(err, resp) {
		if(err){
			log.error(err);
		}else{
			logmessage("statusCode :"+resp.statusCode);
			logmessage("response :");
			logmessage(resp);
		}
		handleResponse(err,resp,parentCallBack);
	});
}

var handleResponse = function(err,resp,parentCallBack){
	if (err) {
		parentCallBack(err,null);
	} else {
		if(resp.statusCode >= minErrorCode){
			parentCallBack(resp,null)
		}else{
			parentCallBack(null,resp);
		}
	}
}

var postUICall = function(controller,postUrl,postData,contentType,parentCallBack) {
	
	fetchJSessionID(controller,function(err,response){

		var csrfToken = getCSRFToken(response);
		var url = getProtocol() + controller +":"+getPort()+postUrl;
		var options = {
			  method: 'POST',
			  rejectUnauthorized: false,
			  headers:{
				  "Content-Type": contentType,
				  "Cookie" : response.headers['set-cookie'],
				  "X-CSRF-TOKEN" : csrfToken
			  }
		};

		needle.post(url, postData, options, function(err, resp) {
			logmessage("statusCode :"+resp.statusCode);
			logmessage("response :");
			logmessage(resp);
			handleResponse(err,resp,parentCallBack);
		});
	});
}

var postJSON = function(controller,postUrl,postData,parentCallBack) {
	post(controller,postUrl,postData,'application/json',parentCallBack);		
}


var getTempPath = function(){
	var path = configManager.getTempDir();
	if(!configManager.isMac()){
		if(!path.endsWith("/")){
			return path + "/";
		}
	}
	return path;
}

var postFile = function(controller,postUrl,postData,parentCallBack) {
	
	var filename = getTempPath()+'temp-dash.json';
	fs.writeFileSync(filename, JSON.stringify(postData));
	
	var data = {
		file: { file: filename, content_type: 'application/json'}
	}
		
	post(controller,postUrl,data,'application/json',parentCallBack);
}

var postXmlFile = function(controller,postUrl,postData,parentCallBack) {
	
	var filename = getTempPath()+'temp.xml';
	fs.writeFileSync(filename, postData);
	
	var data = {
		file: { file: filename, content_type: 'text/xml'}
	}
		
	post(controller,postUrl,data,'text/xml',parentCallBack);
}

var postXml = function(controller,postUrl,postData,parentCallBack) {
	post(controller,postUrl,postData,"text/xml",parentCallBack);
}


var makeFetch = function(controller,url,callback){
	fetch(controller,url,function(err,response){
		if(err){
			callback(err,null);
		}else{
			callback(null,JSON.parse(response));
		}
	});
}


exports.fetchDashboard = function(dashboardId,callback){
	var url = "/controller/CustomDashboardImportExportServlet?dashboardId="+dashboardId;
	makeFetch(config.controller,url,callback);
}

exports.fetchActions = function(appID, callback){
	var url = "/controller/actions/"+appID;
	fetch(config.controller,url,function(err,response){
		if(err){
			callback(err,null);
		}else{
			callback(null,response);
		}
	});
}

exports.fetchPolicies = function(appID, callback){
	var url = "/controller/policies/"+appID;
	fetch(config.controller,url,function(err,response){
		if(err){
			callback(err,null);
		}else{
			callback(null,response);
		}
	});
}

exports.fetchHealthRules = function(appID, callback){
	var url = "/controller/healthrules/"+appID;
	fetch(config.controller,url,function(err,response){
		if(err){
			callback(err,null);
		}else{
			callback(null,response);
		}
	});
}

exports.fetchHealthRule = function(appID,hrName,callback){
	var url = "/controller/healthrules/"+appID+"?name="+encodeURIComponent(hrName);
	fetch(config.controller,url,function(err,response){
		if(err){
			callback(err,null);
		}else{
			callback(null,response);
		}
	});
}

exports.postHealthRules = function(appID,xmlData,forceHealthRules,callback){
	var url = "/controller/healthrules/"+appID;
	if(forceHealthRules){
		url = url+"?overwrite=true";
	}
	postXml(config.controller,url,xmlData,callback);
}

exports.postDashboard = function(dashboard,callback){
	var url = "/controller/CustomDashboardImportExportServlet";
	postFile(config.controller,url,dashboard,callback);
}

exports.postCustomMatchRules = function(applicationID,customMatchRules,entryPointType,callback){
	var url = "/controller/transactiondetection/"+applicationID+"/custom/"+entryPointType+"?overwrite=true";
	postXmlFile(config.controller,url,customMatchRules,callback);
}

exports.fetchUI = function(controller,url,parentCallBack){
	var str = "";
	
	fetchJSessionID(controller,function(err,response){

		var jsessionId = parseCookies(response);
		var options = {
			host : controller,
			port : getPort(),
			method : "GET",
			path : url,
			rejectUnauthorized: false,
			headers : {
				"Cookie" : jsessionId
			}
		};
		
		addproxy(options);

		var callback = function(response) {
			response.on('data', function(chunk) {
				str += chunk;
			});

			response.on('error', function(err) {
				parentCallBack(err,null);
			})

			response.on('end', function() {
				if(config.restdebug){
					log.debug("statusCode :"+response.statusCode);
					log.debug("response :");
					log.debug(str);
				}
				if(response.statusCode >= minErrorCode){
					parentCallBack(str,null);
				}else{
					parentCallBack(null,str);
				}
			});
		}.bind(this)

		if(config.https){
			var req = executeRequest(controller,https,options,callback);
		}else{
			var req = executeRequest(controller,http,options,callback);
		}
	});
}

exports.getAppUI = function(callback) {
	var url = "/controller/restui/applicationManagerUiBean/getApplicationsAllTypes";
	makeFetch(config.controller,url,callback);
}

exports.getAppJson = function(callback) {
	var url = "/controller/rest/applications?output=JSON";
	makeFetch(config.controller,url,callback);
}

exports.getTiersJson = function(app,callback) {
	var url = "/controller/rest/applications/"+app+"/tiers?output=JSON";
	makeFetch(config.controller,url,callback);
}

exports.getNodesJson = function(app,tier,callback) {
	var url = "/controller/rest/applications/"+app+"/tiers/"+tier+"/nodes?output=JSON";
	makeFetch(config.controller,url,callback);
}

exports.getBTList = function(appName,callback) {
	var url = "/controller/rest/applications/" + encodeURIComponent(appName) + "/business-transactions?output=JSON";
	makeFetch(config.controller,url,callback);
}

exports.getBTCallsPerMinute = function(appName,tierName,btName,timeFrame,callback) {
	var url = "/controller/rest/applications/" + encodeURIComponent(appName) + "/metric-data?metric-path=Business%20Transaction%20Performance|Business%20Transactions|" + tierName + "|" + btName + "|Calls%20per%20Minute&time-range-type=BEFORE_NOW&duration-in-mins=" + timeFrame + "&output=JSON";
	makeFetch(config.controller,url,callback);
}

exports.getBTAverageResponseTime = function(appName,tierName,btName,timeFrame,callback) {
	var url = "/controller/rest/applications/" + encodeURIComponent(appName) + "/metric-data?metric-path=Business%20Transaction%20Performance|Business%20Transactions|" + tierName + "|" + btName + "|Average%20Response%20Time%20%28ms%29&time-range-type=BEFORE_NOW&duration-in-mins=" + timeFrame + "&output=JSON";
	makeFetch(config.controller,url,callback);
}

exports.deleteBTs = function (deleteBTList,callback){
	var url = "/controller/restui/bt/deleteBTs";
	postUICall(config.controller,url,JSON.stringify(deleteBTList),"application/json",callback);
}

exports.updateConfiguration = function(){
	config = configManager.getConfig();
}

exports.getAppCallsPerMinute = function(appName,timeFrame,callback) {
	var url = "/controller/rest/applications/" + encodeURIComponent(appName) + "/metric-data?metric-path=Overall%20Application%20Performance%7CCalls%20per%20Minute&time-range-type=BEFORE_NOW&duration-in-mins="+timeFrame+"&output=JSON";
	makeFetch(config.controller,url,callback);
}

exports.getAppCustomMatchRules = function(appId,tierName,callback) {

	var url = "/controller/transactiondetection/" + appId + "/custom";
	if (tierName) {
		url = "/controller/transactiondetection/" + appId + "/" + encodeURIComponent(tierName) + "/custom";
	}
	
	fetch(config.controller,url,function(err,response){
		if(err){
			callback(err,null);
		}else{
			callback(null,response);
		}
	});
}

exports.getHealthRuleViolations = function(appId,timeFrame,callback) {
	var url = "/controller/rest/applications/" + appId + "/problems/healthrule-violations?time-range-type=BEFORE_NOW&duration-in-mins="+timeFrame;
	fetch(config.controller,url,callback);
}

exports.fetchHealthRuleViolations = function(appID,dateRange,callback){
	var url = "/controller/rest/applications/"+appID+"/problems/healthrule-violations?"+dateRange+"&output=JSON";
	makeFetch(config.controller,url,callback);
}

exports.fetchEventsViolations = function(appID,dateRange,callback){
	var url = "/controller/rest/applications/"+appID+"/events?"+dateRange+"&event-types=POLICY_OPEN_CRITICAL,POLICY_CLOSE_CRITICAL,POLICY_CONTINUES_CRITICAL,POLICY_UPGRADED,POLICY_CANCELLED&severities=ERROR&output=JSON";
	makeFetch(config.controller,url,callback);
}

exports.fetchControllerAuditHistory = function(url,callback){
	makeFetch(config.controller,url,callback);
}

exports.fetchSyntheticJobData= function(appkey,start_time,end_time,callback){
	var query = {"query":{"filtered":{"query":{"bool":{"must":[{"match":{"appkey":{"query":appkey}}}]}},"filter":{"bool":{"must":[{"range":{"eventTimestamp":{"from":end_time,"to":start_time}}},{"match_all":{}}]}}}},"size":250,"sort":[{"eventTimestamp":{"order":"desc"}}]};
	var postUrl = "/controller/restui/analytics/searchJson/SYNTH_SESSION_RECORD";
	postUICall(config.controller,postUrl,JSON.stringify(query),callback);
}

exports.fetchSyntheticRecordData= function(appid,synthMeasurementId,callback){
	var url = "/controller/restui/eumSessionsUiService/getSyntheticSessionDetails/"+appid+"/"+synthMeasurementId;
	getUICall(config.controller,url,callback);
}

exports.fetchSyntheticPageData= function(appid,guid,id,callback){
	var url = "/controller/restui/eumSessionsUiService/getPageViewTimelineForSynthetic/"+guid+"/"+id+"/"+appid;
	postUICall(config.controller,url,null,callback);
}

exports.establishJSessionID = function(callback){
	fetchJSessionID(config.controller,function(err,response){
		callback(parseCookies(response));
	});
}

exports.makeRestCall = function(appSession,query,callback){
	var url = "/controller/rest"
	if(query.startsWith("/")){
		url += query;
	}else{
		url += "/"+query;
	}
	getUICall(appSession,config.controller,url,function(err,resp){
		if(err){
			callback(err,null);
		}else{
			callback(null,resp.body);
		}
	});
}

exports.makeInternalCall = function(appSession,query,callback){
	var url = "/controller/restui"
	if(query.startsWith("/")){
		url += query;
	}else{
		url += "/"+query;
	}
	getUICall(appSession,config.controller,url,function(err,resp){
		if(err){
			callback(err,null);
		}else{
			callback(null,resp.body);
		}
	});
}

exports.makeInternalPostCall = function(appSession,query,options,callback){
	var url = "/controller/restui"
	if(query.startsWith("/")){
		url += query;
	}else{
		url += "/"+query;
	}
	postUICall(config.controller,url,options,callback,appSession);
}

exports.makeDatabasePostCall = function(appSession,query,postData,callback){
	var url = "/controller/databasesui"
	if(query.startsWith("/")){
		url += query;
	}else{
		url += "/"+query;
	}
	postUICall(appSession,config.controller,url,postData,callback,appSession);
}


var uiCall = function(method,url,csrfToken,cookieInfo,postData,parentCallBack){
  var options = {
		method: method,
		headers:{
		  json:true,
		  "Content-Type": 'application/json',
		  "Cookie" : cookieInfo,
		  "X-CSRF-TOKEN" : csrfToken
		}
  };

  addproxy(options);

  if(config.restdebug){
	  log.debug("url :"+url);
	  log.debug("postData :"+JSON.stringify(postData));
	  log.debug("options :"+JSON.stringify(options));
  }

  if(method == "POST"){
	needle.post(url, postData, options, function(err, resp) {
		if(config.restdebug){
			log.debug("err :"+err);
			log.debug("resp :"+JSON.stringify(resp.body));
		}
		handleResponse(err,resp,parentCallBack);
	});
  }

  if(method == "GET"){
	needle.get(url,options, function(err, resp) {
		if(config.restdebug){
			log.debug("err :"+err);
			log.debug("resp :"+resp);
		}
		handleResponse(err,resp,parentCallBack);
	});
  }
  
}

var postUICall = function(controller,postUrl,postData,parentCallBack,appSession) {
	console.log("APP SESSION : "+appSession);
	if(appSession){
		logmessage("postUICall authObject : "+JSON.stringify(appSession));
		var url = appSession.getControllerUrl()+postUrl;
		var csrfToken = appSession.getCSRFToken();
		var cookieInfo = JSON.parse(appSession.getCookieInfo());
		uiCall("POST",url,csrfToken,cookieInfo,postData,parentCallBack);
	}else{
		fetchJSessionID(controller,function(err,response){
			if(err){
				parentCallBack(err,null);
				return;
			}
	
			var csrfToken = getCSRFToken(response);
			var cookieInfo = response.headers['set-cookie'];
			var url = getProtocol() + controller +":"+getPort()+postUrl;
			uiCall("POST",url,csrfToken,cookieInfo,postData,parentCallBack);
		});
	}
}

var getUICall = function(appSession,controller,getUrl,parentCallBack) {
	if(appSession){
		logmessage("getUICall authObject : "+JSON.stringify(appSession));
		var url = appSession.getControllerUrl()+getUrl;
		var csrfToken = appSession.getCSRFToken();
		var cookieInfo = JSON.parse(appSession.getCookieInfo());
		uiCall("GET",url,csrfToken,cookieInfo,null,parentCallBack);
	}else{
		fetchJSessionID(controller,function(err,response){

			if (err) {
				parentCallBack(err,null);
				return;
			}
	
			var csrfToken = getCSRFToken(response);
			var cookieInfo = response.headers['set-cookie'];
			var url = getProtocol() + controller +":"+getPort()+getUrl;
			uiCall("GET",url,csrfToken,cookieInfo,null,parentCallBack);
		});
	}
}

exports.analyticsQuery = function(query,start,end,limit,callback){
	var url = configManager.getAnalyticsUrl()+"/events/query?start="+start+"&end="+end+"&limit="+limit;
	var options = {
		method: 'POST',
		headers:{
			json:true,
			"Content-Type": 'application/vnd.appd.events+text;v=2',
			"X-Events-API-AccountName" : configManager.getGlobalAccount(),
			"X-Events-API-Key" : configManager.getAccessKey(),
			"Accept": "application/vnd.appd.events+json;v=2",
			"X-CSRF-TOKEN" : "Content-type: application/vnd.appd.events+text;v=2"
		}
	};
	addproxy(options);
	if(config.restdebug){
		logmessage(url);
		logmessage("Date Range :"+dateHelper.getMillisecondsAsDate(start)+" : "+dateHelper.getMillisecondsAsDate(end));
		logmessage(JSON.stringify(options));
		logmessage(query);
	}

	needle.post(url, query, options, function(err, resp) {
		try{
			var resp  = JSON.parse(resp.body.toString());
		}catch(e){
			err = e.message;
			resp = null;
		}
		
		if(config.restdebug){
			try{
				logmessage("err :"+err);
				logmessage("resp :"+resp);
				logmessage(JSON.stringify(resp[0].results));
			}catch(e){
				
			}
		}
		handleResponse(err,resp,callback);
	});
}



exports.restUIADQL = function(query,start,end,limit,callback){
	var request = {"requests":[{"query":query,"label":"VisualizationQuery","customResponseRequest":true,"responseConverter":"UIGRID","responseType":"ORDERED","start":start,"end":end,"chunk":false,"mode":"none","scrollId":"","size":"","offset":"","limit":"10000"}],"start":"","end":"","chunk":true,"mode":"none","scrollId":"","size":"","offset":"","limit":"10000","chunkDelayMillis":"","chunkBreakDelayMillis":"","chunkBreakBytes":"","others":"false","emptyOnError":"false","token":"","dashboardId":0,"warRoomToken":"","warRoom":false};
	if(config.restdebug){
		logmessage("restUIADQL Call");
		logmessage(JSON.stringify(request));
	}
	postUICall(config.controller,"/controller/restui/analytics/adql/query",request,function(err,resp){
		var data = JSON.parse(resp.body);
		if(config.restdebug){
			logmessage("Results");
			logmessage(JSON.stringify(data));
		}
		if(data[0].chunk){
            var chunk = data[0].chunk;
            handleResponse(chunk[0].error,chunk,callback);
        }else{
			handleResponse("System Error : No Response Results",null,callback);
		}
	});
}

class AuthObject {
    constructor(controllerUrl,account,username,password){
		this.csrfToken = null;
		this.controllerUrl = controllerUrl;
		this.username = username;
		var urlObject = url.parse(controllerUrl);
		this.controller = urlObject.hostname;
		this.port = urlObject.port;
		this.https = urlObject.protocol === "https:";
		this.authString = 'Basic '+ new Buffer(this.username +"@"+account+":"+ password).toString('base64');
		this.cookieInfo = null;
	}

	getControllerUrl(){
		return this.controllerUrl;
	}

	getController(){
		return this.controller;
	}

	isHttps(){
		return this.https;
	}

	getPort(){
		if(this.port){
			return this.port;
		}else if(this.https){
			return 443;
		}else {
			return null;
		}
	}

	getAuthString(){
		return this.authString;
	}

	setCSRFToken(csrfToken){
		this.csrfToken = csrfToken;
	}

	getCSRFToken(){
		return this.csrfToken;
	}

	setCookieInfo(cookieInfo){
		this.cookieInfo  = cookieInfo;
	}

	getCookieInfo(){
		return this.cookieInfo;
	}

	isAuthenticated(){
		return this.csrfToken != null;
	}
}

exports.buildNewAppSession = function(controllerUrl,account,username,password){
	return new AuthObject(controllerUrl,account,username,password);
}

exports.getAuthObject = function(authObj){
	var auth =  new AuthObject(authObj.controllerUrl,authObj.account,authObj.username,null);
	auth.setCSRFToken(authObj.csrfToken);
	auth.setCookieInfo(authObj.cookieInfo);
	return auth;
}

exports.authenticateold = function(appSession,parentCallBack){
	appSession.setCSRFToken(null);
	appSession.setCookieInfo(null);
	var options = {
		host : appSession.getController(),
		port : appSession.getPort(),
		method : "GET",
		path : "/controller/auth?action=login",
		rejectUnauthorized: false,
		headers : {
			"Authorization" : appSession.getAuthString(),
		}
	};
	
	addproxy(options);
	logmessage("authenticateAgainstController options :"+options.host+" : "+options.port);

	var callback = function(response) {
		response.on('data', function(chunk) {
			str += chunk;
		});

		response.on('error', function(err) {
			parentCallBack(err,null);
		})

		response.on('uncaughtException', function(err) {
			parentCallBack(err,null);
		})

		response.on('end', function() {
			if(response.statusCode >= minErrorCode){
				log.error(response);
				parentCallBack(response,null);
			}else{
				var csrfToken = getCSRFToken(response);
				appSession.setCSRFToken(csrfToken);
				appSession.setCookieInfo(JSON.stringify(response.headers['set-cookie']));
				parentCallBack(null,true);
			}
		});
	}.bind(this);

	if(appSession.isHttps()){
		https.request(options,callback).end();
	}else{
		http.request(options,callback).end();
	}
}

exports.authenticate = function(appSession,parentCallBack){
	appSession.setCSRFToken(null);
	appSession.setCookieInfo(null);
	var options = {
		host : appSession.getController(),
		port : appSession.getPort(),
		method : "GET",
		path : "/controller/auth?action=login",
		rejectUnauthorized: false,
		headers : {
			"Authorization" : appSession.getAuthString(),
		}
	};
	
	addproxy(options);
	logmessage("authenticateAgainstController options :"+options.host+" : "+options.port);

	
	const req = https.request(options, (res) => {
		res.on('data', (d) => {
		  //
		});

		res.on('end', function() {
			if(res.statusCode >= minErrorCode){
				//log.error(res);
				parentCallBack("Url, Account or Credentials are invalid!",null);
			}else{
				var csrfToken = getCSRFToken(res);
				appSession.setCSRFToken(csrfToken);
				appSession.setCookieInfo(JSON.stringify(res.headers['set-cookie']));
				parentCallBack(null,true);
			}
		});
	});
	  
	req.on('error', (e) => {
		parentCallBack("Url, Account or Credentials are invalid!",null);
	});
	req.end();
}
