function buildFlowSankey(id,clientRequestId){
    
    var webQuery = "SELECT pagename, count(*), avg(metrics.`End User Response Time (ms)`) FROM browser_records";
    if(clientRequestId){
        webQuery = webQuery + " where userdata.clientrequestid ='"+clientRequestId+"'";   
    }
    var lambda = "select count(*), avg(customevent.duration) from iot_records where eventtype = \"gcv-t-sdpr-lmb-security\"";
    if(clientRequestId){
        lambda = lambda + " and customproperties.`gcv-t-sdpr-lmb-security`.string.uniqueClientId = '"+clientRequestId+"'";
    }
    var networkQuery =  "select networkrequestevent.url, count(*), avg(networkrequestevent.duration) from iot_records where eventtype=\"Network Request\" AND customproperties.`gcv-t-sdpr-lmb-security`.string.uniqueClientId is not NULL";
    if(clientRequestId){
        networkQuery =  "select networkrequestevent.url, count(*), avg(networkrequestevent.duration) from iot_records where eventtype=\"Network Request\" AND customproperties.`gcv-t-sdpr-lmb-security`.string.uniqueClientId ='"+clientRequestId+"'";
    }

    searchRestUI({query:webQuery},function(webdata){
        searchRestUI({query:lambda},function(lambdaData){
            searchRestUI({query:networkQuery},function(network){
                _buildSankey(id,webdata,lambdaData,network);
            });
        });
    });
}

function _buildSankey(id,webdata,lambda,network){
    var nodes = ["Web","Lambda - gcv-t-sdpr-lmb-security "];
    var source = [];
    var target = [];
    var values = [];

    var webCounts = 0;
    var webResponse = 0;
    webdata.forEach(element => {
        nodes.push(element[0]+" : Calls = "+element[1]+" Avg Resp = "+roundValue(element[2]));
        source.push(nodes.length-1);
        target.push(0);  
        values.push(element[2]);
        webCounts += element[1];
        webResponse += roundValue(element[2]);
    });

    nodes[0] = "Web : Calls = "+webCounts+" Total Resp = "+webResponse;
    
    nodes[1] = nodes[1]+": Calls = "+lambda[0][0]+" Avg Resp = "+roundValue(lambda[0][1]);
    source.push(0);
    target.push(1);
    values.push(roundValue(lambda[0][1]));

    var totalNetworkCount = 0;
    var count =0;
    network.forEach(element =>{
        nodes.push(element[0]+" Calls = "+element[1]+ " Avg Resp = "+roundValue(element[2]));
        source.push(1);
        target.push(nodes.length-1);
        values.push(roundValue(element[2]));
    }); 

    sankeyChart = new PlotlySankeyChart({
		targetId:id,
		title:"Flow Map",
        data:{nodes:nodes,source:source,target:target,values:values},
        options:{
            orientation: "v",
            layout: {
                title: "Flow Map",
                font: {
                    size: 10
                },
                plot_bgcolor:"#f1f3f5",
                paper_bgcolor:"#f1f3f5"
            }
        }
	});
	sankeyChart.renderChart(function(selection){
		alert(JSON.stringify(selection));
	});
}