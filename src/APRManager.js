var Q = require('q');
var async = require ('async');

exports.topDBQueries = function(appSession,restManager,topX,start,end){

	var deferred = Q.defer();
	var query = "/databases/list";
	var request = {"requestFilter":{},"resultColumns":["ID","NAME","TYPE"],"offset":topX,"limit":-1,"searchFilters":[],"columnSorts":[{"column":"HEALTH","direction":"DESC"}],"timeRangeStart":start,"timeRangeEnd":end};
	var results = [];
	restManager.makeDatabasePostCall(appSession,query,request,function(err,databases){
		
		if(databases.data){
			databases.data.forEach(function(db){
				var dbInfo = {};
				dbInfo.name = db.name;
				dbInfo.id = db.id;
				results.push(dbInfo);
			})
		}

		async.transform(results, function(acc, db, index, callback) {

			var dbQueryList = "/databases/queryListData"
			var dbRequest = {"cluster":false,"serverId":db.id,"field":"query-id","size":5,"filterBy":"time","startTime":start,"endTime":end,"waitStateIds":[],"useTimeBasedCorrelation":false}
			restManager.makeDatabasePostCall(appSession,dbQueryList,dbRequest,function(err,queries){
				if(err){
					/**
					 *TODO: Log properly.
					 */
					console.log(JSON.stringify(err.body));
				}else
				{
					db.data = [];
					queries.forEach(function(query){
						var time = 0;
						var art = 0;
						if(query.duration){
							try{
								time = (query.duration/1000)/60;
								art = (query.duration)/query.hits;
							}catch(error){
								time = 0;
								art = 0;
							}
						}

						db.data.push({time:time,hits:query.hits,art:art,query:query.queryText});
					})

					acc.push(db);
					callback(null);
				}
			});		
		}, function(err, result) {
			if(err){
				deferred.resolve({err:err});
			}else{
				deferred.resolve({result:result});
			}
		});

	});
	return deferred.promise;
}


