var express = require('express');
var router = express.Router();

router.post('/', function(req, res) {
	var parms = req.body;
	var query = parms.query;
	var appSession = req.restManager.getAuthObject(req.session.authObj);
	
	req.restManager.makeRestCall(appSession,query,function (err,resp) {
		if(err){
			res.status(500).send(err.body);
		}else{
			res.status(200).send(resp);
		}
	});
});

module.exports = router;
