ANG_TED_APP.

	/*
		Talkを検索する
	*/
	controller('searchCtrl', ['$scope', '$http', 'API_URL', 'getTedPram', 'gettingTalk', '$timeout', '$location', 'getPram', function($scope, $http, API_URL, getTedPram, gettingTalk, $timeout, $location, getPram){

		$scope.keyword  = "";
		$scope.talks = [];
		// 検索中か？
		$scope.isSearching = false; 
		$scope.search = function(){
			$scope.isSearching = true;
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
				}

				// 検索完了
				$scope.isSearching = false;
			}).
			error(function(){
				$scope.isSearching = false;
			});
		};

		$scope.pressInput = function(e){
			if(e.charCode == 13){
				$scope.search();
			}
		};

		/*
			Talkページヘ
		*/
		$scope.goTalk = function(talk_id){
			var param = getPram({
				talk_id: talk_id
			});
			$location.url("/talk?"+param);
		};
	}]).
	
	/*
		Talk
	*/
	controller('talkCtrl', ['$scope', '$location', 'gettingTalk', 'gettingSubtitle', function($scope, $location, gettingTalk, gettingSubtitle){
		var talk_id = $location.search()['talk_id'];
		$scope.talk_id = talk_id;
		$scope.talk;
		$scope.video_url = "";
		$scope.video_time = 0;
		$scope.subtitleLanguages = [];
		$scope.subtitles = {};
		$scope.nowSubtitles = {};

		var setSubtitle = function(sec){
			var subtitleLang;
			for(var lang in $scope.nowSubtitles){
				subtitleLang = lang;
				break;
			}
			var subtitles = $scope.subtitles[subtitleLang];
			for(var i = 0; i < subtitles.length; i++){
				var subtitle = subtitles[i].caption;
				var startTime = subtitle.startTime;
				if(startTime > sec*1000){
					break;
				}
			}
			if(i == 0) return;

			// iを元に字幕を入れる
			for(var lang in $scope.nowSubtitles){
				$scope.nowSubtitles[lang] = $scope.subtitles[lang][i-1].caption.content;
			}
			
		};

		// 字幕を表示するか決める
		$scope.selectSubtitle = function(lang){
			var langFullName = $scope.talk.languages[lang].name;
			var subtitleText = langFullName+" subtitles are ready.";

			if(angular.isDefined($scope.subtitles[lang])){
				if(angular.isDefined($scope.nowSubtitles[lang])){
					// 表示する字幕を削除
					delete $scope.nowSubtitles[lang];
				} else {
					// $scope.subtilesにはあるので、表示言語を追加
					$scope.nowSubtitles[lang] = subtitleText;
				}
				return;
			}
			$scope.nowSubtitles[lang] = "Loading "+langFullName+" subtitles...";
			gettingSubtitle(function(subtitles){
				$scope.subtitles[lang] = subtitles;
				$scope.nowSubtitles[lang] = subtitleText;
			}, talk_id, lang);
		};

		// 字幕を表示しない
		$scope.clearAll = function(){
			$scope.nowSubtitles = {};
		};

		// Talkを取得
		gettingTalk(talk_id, function(talk){
			$scope.talk = talk;
			/*
				Video
				(Error: [$interpolate:interr])になり、Videoがバインドされないので、DOM操作する
			*/
			$scope.video_url = talk.media.internal['450k'].uri;
			var myVideo = document.getElementsByTagName('video')[0];
			myVideo.src = $scope.video_url;
			myVideo.addEventListener("timeupdate", function(){
				// videoの再生位置が変更した時
				$scope.$apply(function(){
					$scope.video_time = myVideo.currentTime;
					setSubtitle($scope.video_time);
				});	
			}, false);

			// デフォルトで英語・日本の字幕取得
			$scope.selectSubtitle("en");
			$scope.selectSubtitle("ja");

			myVideo.load();
			console.log(talk);
		});


	}]);