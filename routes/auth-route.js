var express = require('express');
var router = express.Router();

router.post('/', function(req, res) {
	var request = req.body;
	var authObj = req.restManager.buildNewAppSession(request.controller,request.account,request.username,request.password);
	req.restManager.authenticate(authObj,function(err,success){
		// console.log("Error : "+err);
		// console.log("Success : "+success);
		if(success){
			req.session.authObj = authObj;
			res.status(200).send({auth:true});
		}else{
			res.status(400).send({auth:false,message:err});
		}
	});
});

module.exports = router;
