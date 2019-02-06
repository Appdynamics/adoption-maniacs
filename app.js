var log4js = require('log4js');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var restManager = require('./src/RestManager.js');
var configManager = require('./src/ConfigManager.js');
var analyticsManager = require('./src/AnalyticsManager.js');
var aprManager = require('./src/APRManager.js');
var analyticsRoute = require('./routes/analytics-route.js');
var internalRestRoute = require('./routes/internal-restui.js');
var restRoute = require('./routes/rest-route.js');
var authRoute = require('./routes/auth-route.js');

var session = require('express-session');
var FileStore = require('session-file-store')(session);
const https = require('https');
const fs = require('fs');
var log = log4js.getLogger("app");

var app = express();

app.use(session({
    name: 'biqapp-apr-report',
    secret: 'CDD5342FE3926F900605227AC25E96B13A3375EB0BD4B4FE2EC3A5C45255814D',
    saveUninitialized: true,
    resave: true,
    store: new FileStore()
}));

app.use(function(req,res,next){
    req.restManager = restManager;
    req.analyticsManager = analyticsManager;
    req.aprManager = aprManager;
    res.locals.controller = configManager.getControllerUrl();
    res.locals.version = configManager.getVersion();
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html',require('ejs').renderFile);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/public/images/*', function (req,res)
{
    res.sendFile (__dirname+req.url);
});
app.use(express.static(__dirname + '/public/images'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.use('/analytics',analyticsRoute);
app.use('/internalrestui',internalRestRoute);
app.use('/rest',restRoute);
app.use('/auth',authRoute);

if(configManager.isAuthEnabled()){
    app.use(function(req,res,next){
        var isAuthenticated = false;
        if(req.session && req.session.authObj){
            var appSession = req.restManager.getAuthObject(req.session.authObj);
            isAuthenticated = appSession.isAuthenticated();
        }
        if(isAuthenticated){
            return next();
        }else{
            console.log(req.originalUrl);
            if(req.originalUrl === "/views/login.html"){
                return next();
            }else{
                res.redirect("/views/login.html");
            }
        }
    });
}

app.get('/', function(req, res){ 
    res.redirect('/views/index.html');
}); 

app.get('/views/index.html', function(req, res){ 
    res.render('index.html'); 
}); 

app.get('/views/login.html', function(req, res){ 
    res.render('login.html'); 
}); 

if (configManager.getDashboards()){
    configManager.getDashboards().forEach(function(dashboard){
        dashboard.views.forEach(function(view){
            var viewUrl = "";
            if(dashboard.path.length>1){
                viewUrl = dashboard.path+"/"+view;
            }else{
                viewUrl = "/"+view;
            }
            var path = "/views"+viewUrl;
            console.log("registring : "+path);
            app.get( path, function(req, res){ 
                //console.log(".."+req.path);
                res.render(".."+req.path); 
            }); 
        });
    });
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error(req.originalUrl,'Not Found\n Referreral :'+req.headers.referer);
    err.status = 404;
    next(err);
});


if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
    	log.error("Something went wrong:", err);
        res.status(err.status || 500);
        res.render('error.html', {
            message: err.message,
            error: err
        });
    });
}

app.use(function(err, req, res, next) {
	log.error("Something went wrong:", err);
    res.status(err.status || 500);
    res.render('error.html', {
        message: err.message,
        error: {}
    });
});


process.on('exit', function() {
	console.log("shutting down");
});

module.exports = app;
