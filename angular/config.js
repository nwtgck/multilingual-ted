var ANG_TED_APP = angular.module('TED_APP', ['ngRoute']).
	config(['$routeProvider', function($routeProvider){
		$routeProvider.
			when('/search', {
				templateUrl: "/search"
			}).

			when('/talk', {
				templateUrl: "/talk"
			}).

			otherwise({
				redirectTo: "/search"
			});
	}]);