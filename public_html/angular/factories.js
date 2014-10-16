ANG_TED_APP.

	/*
		API KEYとcallback=JSON_CALLBACKを追加したGETパラメータを返す
	*/
	factory('getTedPram', ['getPram', 'API_KEY', function(getPram, API_KEY){
		return function(pramObj){
			pramObj["api-key"] = API_KEY;
			pramObj["callback"] = "JSON_CALLBACK";
			return getPram(pramObj);
		};
	}]).

	/*
		Talkの詳しい情報を取得
	*/
	factory('gettingTalk', ['$http', 'getTedPram', 'API_URL', function($http, getTedPram, API_URL){
		var loopLim = 10;
		var gettingTalk = function(id, success, loopCnt){
			loopCnt = loopCnt | 0;
			loopCnt++;
			var pram = getTedPram({});
			$http.jsonp(API_URL + "talks/"+id+".json?"+pram).
			success(function(data){
				// コールバックする
				success(data.talk);
			}).
			error(function(data, status, headers, config){
				// エラーする限りループ
				if(loopCnt <= loopLim){
					gettingTalk(id, success, loopCnt);
				}

			});
		};

		return gettingTalk;
	}]).

	factory('queQueries', ['$timeout', function($timeout){
		var wait = 1000;
		var queries = [];
		var isLooping = false;
		var loop = function(){
			if(queries.length == 0){
				// ループ終了
				isLooping = false;
			} else {
				var query = queries.shift();
				query();
				$timeout(loop, wait);
			}
		};
		var push = function(func){
			queries.push(func);
			if(isLooping == false){
				// ループ開始
				isLooping = true;
				loop();
			}
		};

		return {
			push : push
		};
	}]).

	/*
		字幕取得
	*/
	factory('gettingSubtitle', ['$http', 'getTedPram', 'API_URL', function($http, getTedPram, API_URL){
		var loopLim = 10;
		var gettingSubtitle = function(success, talk_id, language, loopCnt){
			loopCnt = loopCnt | 0;
			loopCnt++;
			var pram = getTedPram({
				language: language || "en"
			});
			$http.jsonp(API_URL + "talks/"+talk_id+"/subtitles.json?"+pram).
			success(function(data){
				// コールバックする
				var subtitles = [];
				for(var i = 0; angular.isDefined(data[i+""]); i++){
					subtitles.push(data[i+""]);
				}
				success(subtitles);
			}).
			error(function(data, status, headers, config){
				// エラーする限りループ
				if(loopCnt <= loopLim){
					gettingSubtitle(talk_id, success, language, loopCnt);
				}
			});
		};
		return gettingSubtitle;
	}]);

