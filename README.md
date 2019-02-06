
## Required Frameworks

1. NodeJS

References:

* https://nodejs.org/en/download/

We are working on removing the bower dependency.

## Installing

1. Download the latest release https://github.com/Appdynamics/biqapp-sdk/releases
1. Change into the directory: `cd biqapp-sdk`
1. Download npm dependencies: `npm install`
1. Create a config.json file in the root directory with the following :

```
{
	"localport":3000,
	"controller":"<customer1>.saas.appdynamics.com",
    "https":true,
	"restuser":"user@customer1",
	"restpassword":"",
	"restdebug":false
}
```

If you copy the above default text, you can still run the node.js server. Only configure the global and access keys when you are ready to execute adql queries.

* `localport`: the port that the node.js server will be started on
* `controller`: e.g. gummybears.saas.appdynamics.com
* `https`: use the https protocol
* `restdebug`: If set to true, will print debug statements on the console

If you are running your controller with a different port e.g. 8090 then you need to add the port element e.g.

```
"controller" : "server.saas.appdynamics.com",
"port": 8090,
```

6. Start node.js: `npm start`
7. Open browser to:
   http://localhost:3000

# Documentation
You can navigate to http://localhost:3000/views/examples/intro.html

