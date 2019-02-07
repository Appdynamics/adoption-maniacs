var internalRestUI = '/internalrestui';
var restAPI = '/rest';

function searchControllerRestUI(query,callback){
    var request = {query:query,internal_method:"GET"};
    internalQuery(internalRestUI,request,callback);
}

function postControllerRestUI(request,callback){
    request.internal_method = "POST";
    internalQuery(internalRestUI,request,callback);
}

function callRestAPI(query,callback){
    var request = {query:query,internal_method:"GET"};
    internalQuery(restAPI,request,callback);
}

function internalQuery (url,request,callback){
    startAnim(request.query);
    $.ajax({
            url: url,
            method: "POST",
            data : request
    }).done(function (data) {
        appLog(request);
        callback(data);
        stopAnim(request.query);
    }).fail(function (jqXHR, message) { 
        alert(jqXHR.statusText+" : "+jqXHR.responseText);
        stopAnim(request.query);
    });
}
