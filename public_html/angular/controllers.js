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
	controller('talkCtrl', ['$scope', '$location', 'gettingTalk', 'gettingSubtitle', '$timeout', function($scope, $location, gettingTalk, gettingSubtitle, $timeout){
		var talk_id = $location.search()['talk_id'];
		$scope.talk_id = talk_id;
		$scope.talk;
		/*
			動画の再生位置
		*/
		$scope.video_time = 0;

		/*
			talkの各言語の字幕データ
		*/
		$scope.subtitles = {};


		/*
			リアルタイムに表示している字幕
			構造
			{"ja": " 今の日本語字幕", "en": "real time English subtitle"}
		*/
		$scope.nowSubtitles = {};

		/*
			リアルタイムに表示する、文章形式の字幕
			構造
			{"en": ["This is", "my first trip"]}
		*/
		$scope.nowSentenseSubtitles = {};


		/*
			 センテンスの終わり
		*/
		var sentense_end_indexs = [];

		/*
			文章字幕にするかどうか
		*/
		$scope.isSentenseSubtitled = true;

		/*
			動画の質
		*/
		$scope.video_quality = "450k";


		/* 現在の字幕のインデックス*/
		$scope.nowSubtitleIndex = -1;
		/*
			文の区切れ目を調べる
		*/
		var setSentenseEnds = function(){
			var en_subtitles = $scope.subtitles["en"];
			var i, j;
			for(i = 0; i < en_subtitles.length; i++){
				var sub = en_subtitles[i].caption.content;
				// TODO: 正規表現で文末判定に
				var end = sub.slice(-1);
				if(end == "." || end == ")" || end == "?" || end == "!"){
					sentense_end_indexs.push(i);
				}

			}

			// test
			var buff;
			for(i = 0; i < sentense_end_indexs.length; i++){
				buff = "";
				for(j = sentense_end_indexs[i-1]+1 || 0; j <= sentense_end_indexs[i]; j++){
					buff += " " + $scope.subtitles["en"][j].caption.content;
				}
				console.log(buff);
			}
			console.log(sentense_end_indexs);
		};


		/*
			再生位置から、いまの字幕のインデックスを取得
		*/
		var getSubtitleIndex = function(sec){

			var subtitles = $scope.subtitles["en"];
			for(var i = 0; i < subtitles.length; i++){
				var subtitle = subtitles[i].caption;
				var startTime = subtitle.startTime;
				if(startTime > sec*1000){
					$scope.nowSubtitleIndex = i-1;
					return i-1;
				}
			}
		};

		/*
			再生位置から、字幕を設定
		*/
		var setSubtitle = function(sec){
			var idx = getSubtitleIndex(sec);
			for(var lang in $scope.nowSubtitles){
				var language = $scope.talk.languages[lang].name;
				$scope.nowSubtitles[lang] = "["+language+" subtitles are ready]";
			}
			if(idx == -1) return;

			// iを元に字幕を入れる
			for(var lang in $scope.nowSubtitles){
				$scope.nowSubtitles[lang] = $scope.subtitles[lang][idx].caption.content;
			}
		};

		/*
			再生位置から、文章字幕を設定
		*/
		var setSentenseSubtitles = function(sec){
			var idx = getSubtitleIndex(sec);
			var start_idx = 0;
			var end_idx = 0;

			for(var lang_code in $scope.nowSentenseSubtitles){
				var language = $scope.talk.languages[lang_code].name;
				$scope.nowSentenseSubtitles[lang_code] = [{content: "["+language+" sentence subtitles are ready]"}];
			}
			if(idx == -1) return;

			// 文章のスタートとエンドを探す
			for(var i = 0; i < sentense_end_indexs.length; i++){
				if(idx <= sentense_end_indexs[i]){
					end_idx = sentense_end_indexs[i];
					break;
				}
				start_idx = sentense_end_indexs[i]+1;
			}
			
			// 字幕をセット
			for(var lang_code in $scope.nowSentenseSubtitles){
				$scope.nowSentenseSubtitles[lang_code] = [];
				for(i = start_idx; i <= end_idx; i++){
					$scope.nowSentenseSubtitles[lang_code].push({
						now: (idx == i)? true: false,
						content: " "+$scope.subtitles[lang_code][i].caption.content
					});
				}
			}
		};

		// 字幕を表示するか決める
		$scope.selectSubtitle = function(lang){
			var langFullName = $scope.talk.languages[lang].name;

			if(angular.isDefined($scope.subtitles[lang])){
				if(angular.isDefined($scope.nowSubtitles[lang])){
					// 表示する字幕を削除
					delete $scope.nowSubtitles[lang];
					delete $scope.nowSentenseSubtitles[lang];
				} else {
					// $scope.subtilesにはあるので、表示言語を追加
					$scope.nowSubtitles[lang] = "";
					$scope.nowSentenseSubtitles[lang] = [];
				}
				return;
			}
			$scope.nowSubtitles[lang] = "Loading "+langFullName+" subtitles...";
			gettingSubtitle(function(subtitles){
				$scope.subtitles[lang] = subtitles;
				$scope.nowSubtitles[lang] = "";
				$scope.nowSentenseSubtitles[lang] = [];
				//　英語字幕の時は文章の区切れ目を調べる
				if(lang == "en"){
					setSentenseEnds();
				}
			}, talk_id, lang);
		};

		// 字幕非表示にする
		$scope.clearAll = function(){
			$scope.nowSubtitles = {};
			$scope.nowSentenseSubtitles = {};
		};

		// 動画のURLが変更時
		$scope.onchangeVideoUrl = function(){
			var myVideo = document.getElementsByTagName('video')[0];
			var currentTime = myVideo.currentTime;
			myVideo.src = $scope.talk.media.internal[$scope.video_quality].uri;

				
			myVideo.addEventListener('loadedmetadata', function(){
				myVideo.currentTime = currentTime;
				myVideo.play();
			});
			
		};

		/*
			字幕のインデックスから、再生位置を変更
		*/
		$scope.changeVideoPositionBySubtitle = function(forward){
			var startTime;

			$scope.nowSubtitleIndex += forward;

			// 前または後ろに字幕がなかったら
			if($scope.nowSubtitleIndex < 0 || $scope.nowSubtitleIndex >= $scope.subtitles['en'].length){
				return;
			}
			startTime = $scope.subtitles['en'][$scope.nowSubtitleIndex].caption.startTime;
			myVideo = document.getElementsByTagName('video')[0];
			myVideo.currentTime = startTime/1000;
		};

		// Talkを取得
		gettingTalk(talk_id, function(talk){
			$scope.talk = talk;
			/*
				Video
				(Error: [$interpolate:interr])になり、Videoがバインドされないので、DOM操作する
			*/
			$scope.onchangeVideoUrl();
			var myVideo = document.getElementsByTagName('video')[0];
			myVideo.addEventListener("timeupdate", function(){
				// videoの再生位置が変更した時
				$scope.$apply(function(){
					$scope.video_time = myVideo.currentTime;
					setSubtitle($scope.video_time);
					setSentenseSubtitles($scope.video_time);
				});	
			}, false);

			// デフォルトで英語・日本の字幕取得
			$scope.selectSubtitle("en");
			$scope.selectSubtitle("ja");

			myVideo.load();
			console.log(talk);
		});


	}]);