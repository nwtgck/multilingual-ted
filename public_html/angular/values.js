ANG_TED_APP.
	
	value('API_KEY', "yeckpr359vjphc6xud6ddw3u").
	
	value('API_URL', "https://api.ted.com/v1/").

	/*
		pramObj {Object}	
	*/
	value('getPram', function(pramObj){
		var pram = [];
		for(var name in pramObj){
			var value = pramObj[name];
			pram.push(name+"="+value);
		}
		return pram.join("&");
	})