var AWS = require('aws-sdk');
AWS.config.loadFromPath('./awscreds.json');
var polly = new AWS.Polly();
var fs = require('fs');

exports.getFilePath = function(id){
    return "./public/audio/"+id+".mp3";
}

exports.generateSound = function(id,text){
    var params = {
        OutputFormat: 'mp3',
        Text: text,
        VoiceId:'Joanna'
    }

    var soundCallback = function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else console.log(data); // successful response
        var filename = exports.getFilePath(id);
        fs.writeFile(filename, data.AudioStream, function (err) {
            if (err) { 
                console.log('An error occurred while writing file :'+filename);
                console.log(err);
            }
            console.log('Finished writing :'+filename);
        });
    };
    polly.synthesizeSpeech(params, soundCallback);
}