var audiotext = require("../audiotext.json");
var pollyManager     = require("./PollyManager.js");
var fs = require('fs');

exports.init = function(){
    //generate audio files.
    audiotext.texts.forEach(elem => {
        var id = elem.id;
        var filePath = pollyManager.getFilePath(id);
        fs.access(filePath, (err) => {
            if (!err) {
              console.log(filePath+' exists');
              return;
            }
            console.log(filePath+' does not exist .. generating');
            pollyManager.generateSound(id,elem.text)
        });
    });
}