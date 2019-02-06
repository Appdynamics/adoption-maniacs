var express = require('express');
var router = express.Router();

router.post('/', function(req, res) {
	var parms = req.body;
	var query = parms.query;
	var options = parms.options;
	var internal_method = parms.internal_method;
	var appSession = req.restManager.getAuthObject(req.session.authObj);
	if(internal_method == "GET"){
		req.restManager.makeInternalCall(appSession,query,function (err,resp) {
			if(err){
				res.status(500).send(err.body);
			}else{
				res.status(200).send(resp);
			}
		});
	}
	if(internal_method == "POST"){
		if(query == "dbQueries"){
			var parmOptions = JSON.parse(options);
			req.aprManager.topDBQueries(appSession,req.restManager,parmOptions.topX,parmOptions.start,parmOptions.end).then(function(result){
				if(result.err){
					res.status(500).send(result.err.body);
				}else{
					res.status(200).send(result.result);
				}
			})
		}else{
			req.restManager.makeInternalPostCall(appSession,query,options,function (err,resp) {
				if(err){
					res.status(500).send(err.body);
				}else{
					res.status(200).send(resp);
				}
			});
		}
	}
});
module.exports = router;
