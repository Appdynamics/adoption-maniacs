var config	= require("../avaconfig.json");

exports.isDevMode = function(){
	if(config.prod){
        return false;
    }
    return true;
}

exports.getConfig = function(){
    return config;
}
