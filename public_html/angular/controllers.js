ANG_TED_APP.

	/*
		Talkを検索する
	*/
	controller('searchCtrl', ['$scope', '$http', 'API_URL', 'getTedPram', 'gettingTalk', '$timeout', function($scope, $http, API_URL, getTedPram, gettingTalk, $timeout){

		$scope.keyword  = "";
		$scope.talks = [];
		// 検索中か？
		$scope.searching = false; 
		$scope.search = function(){
			$scope.searching = true;
			var pram = getTedPram({
				q: $scope.keyword,
				categories : "talks",
				sort: "popular"
			});

			$http.jsonp(API_URL+"search.json?" + pram).
			success(function(data){
				$scope.talks = [];
				$scope.data = data;

				// talksにデータを詰め込む
				for(var i = 0; i < data.results.length; i++){
					var talk  = data.results[i]['talk'];
					if(angular.isUndefined(talk)) continue;
					$scope.talks.push(talk);

					// Talkの画像などの詳しいデータを取得
					
					(function(talkIdx){
						$timeout(function(){
							var talkId = $scope.talks[talkIdx].id;
							gettingTalk(talkId, function(talk){
								// 画像URL（最大サイズ）
								var imageUrl = talk.images[0].image.url;
								// 再生回数
								$scope.talks[talkIdx].image_url = imageUrl;
								$scope.talks[talkIdx].viewed_count = talk.viewed_count;
							});
						}, 100);
					}($scope.talks.length-1));


					// 検索完了
					$scope.searching = false;
				}
			});
		};

		$scope.pressInput = function(e){
			if(e.charCode == 13){
				$scope.search();
			}
		}
	}]);