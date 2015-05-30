//Remove the no-js class, cause Javascript is present
document.documentElement.classList.remove('no-js');

//Beginning Angular
var petPals = angular.module('petPals',['ngRoute']);

petPals.config(function ($routeProvider) {
	$routeProvider
	.when('/',{
		templateUrl: './views/partials/welcome.html'
	})
	.when('/main',{
		templateUrl: './views/partials/main.html'
	})
	.when('/pet',{
		templateUrl: './views/partials/pet.html'
	})
	.when('/finished',{
		templateUrl: './views/partials/finished.html'
	})
	.otherwise({
		redirectTo: '/'
	})
});

//Place Factories here
petPals.factory('petFactory', function ($http, $window) {
	var factory = {};
	var userLatitude;
	var userLongitude;
	var startLatitude = 37.294381;
	var startLongitude = -121.850196;

	var locationDiv = document.getElementById('location');

	factory.getLocation = function (callback) {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function (position) {
				userLatitude = position.coords.latitude;
				userLongitude = position.coords.longitude;
				console.log(userLatitude);
				console.log(userLongitude);
				callback(position);
			});
		}
		else {
			var toSet = "";
			toSet = "Geolocation not supported input your own starting and ending coordinates below";
	    	toSet += "<form>";
	    	toSet += "Starting Latitude:<input type='text' name='start_latitude' ng-model = 'location.latitude'>";
	    	toSet += "Starting Longitude:<input type='text' name='start_longitude' ng-model = 'location.longitude'>";
	    	toSet += "<input type='submit' ng-model='manualLocation(location)'"
	    	toSet += "</form>";
	    	locationDiv.innerHTML = toSet;
		}
	}

	factory.getPrice = function (callback) {
		console.log(userLatitude);
		console.log(userLongitude);
		$http.post('/price', {start_latitude: startLatitude, start_longitude: startLongitude, end_latitude: userLatitude, end_longitude: userLongitude}).success(function (output) {
			callback(output);
		});
	}

	factory.request = function (callback) {
		//$window.location.assign('/auth/uber');
		// $http.get('/auth/uber').success(function (output) {
		// 	console.log('authenticationoutput',output);
		// })
 		$http.get('/auth/isAuthenticated').success(function (output) {
 			if (output == true) {
 				console.log("WOOOT");
 				$http.post('/request', {start_latitude: startLatitude, start_longitude: startLongitude, end_latitude: userLatitude, end_longitude: userLongitude}).success(function (rideoutput) {
					callback(rideoutput);
				})
 			} else {
 				$window.location.assign('/auth/uber');
 			}
 		});
		// 	console.log('authenticationoutput',output);
		// })
		
	}

	return factory;
})

//Place Controllers here
petPals.controller('welcomeController', function ($scope, petFactory, $window) {
	$scope.search = function () {
		$window.location.assign('#/main')
	}
})

petPals.controller('mainController', function ($scope, petFactory, $window) {
	petFactory.getLocation(function (data) {
		$scope.location = data;
		console.log('got location!');
		petFactory.getPrice(function (price) {
			console.log(price);
			$scope.price = price.prices[0].estimate;
			$scope.distance = price.prices[0].distance;
		})
	})

	$scope.select = function () {
		$window.location.assign('#/pet');
	}
})

petPals.controller('petController', function ($scope, petFactory, $window) {
	petFactory.getLocation(function (data) {
		$scope.location = data;
	})

	$scope.goBack = function () {
		$window.location.assign('#/main')
	}

	$scope.request = function () {
		petFactory.request(function (data) {
			console.log('rideoutput',data);
		})
		// $window.location.assign('#/finished')
	}
})

petPals.controller('finishedController', function ($scope, petFactory, $window) {

})