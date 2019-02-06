
function biqAppLogin (controller, account, username, password, callback){
    var authUrl = '/auth';
    var request = {controller:controller,account:account,username:username,password:password};
    $.ajax({
            url: authUrl,
            method: "POST",
            data : request
    }).done(function (data) {
        callback(data);
    }).fail(function (err) { 
        callback({auth:"failed",message: err.responseJSON.message});
    });
}
