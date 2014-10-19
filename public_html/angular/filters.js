ANG_TED_APP.
	filter('orderByNum', function(){
		return function(array, prop, reverse){
			if(!angular.isArray(array)) return array;

			return array.sort(function(a, b){
				return (!angular.isNumber(a[prop]) || !angular.isNumber(b[prop]))? 1: (reverse == true)? b[prop] - a[prop]: a[prop] - b[prop];
			});
		};
	}).

	filter('objectOrderBy', function(){
		return function(obj, prop){
			var array = [];
			for(var key in obj){
				array.push({
					key: key,
					value: obj[key]
				});
			}
			return array.sort(function(o1, o2){
				return o1 - o2;
			});
		};
	});