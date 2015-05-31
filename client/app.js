//Remove the no-js class, cause Javascript is present
document.documentElement.classList.remove('no-js');

//Beginning Angular
var petPals = angular.module('petPals',['ngRoute'])
.config(function ($routeProvider) {
	$routeProvider
	.when('/',{
		controller: 'welcomeController',
		templateUrl: './views/partials/welcome.html'
	})
	.when('/main',{
		controller: 'mainController',
		templateUrl: './views/partials/main.html'
	})
	.when('/pet',{
		controller: 'petController',
		templateUrl: './views/partials/pet.html'
	})
	.when('/finished',{
		controller: 'finishedController',
		templateUrl: './views/partials/finished.html'
	})
	.otherwise({
		redirectTo: '/'
	})
});

//Place Factories here
petPals.factory('petFactory', function ($http) {
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
			});
		}
		else {
			var toSet = "";
			toSet = "Geolocation not supported input your own starting and ending coordinates below";
			toSet += "<form>";
			toSet += "Starting Latitude:<input type='text' name='start_latitude' ng-model = 'location.latitude'>";
			toSet += "Starting Longitude:<input type='text' name='start_longitude' ng-model = 'location.longitude'>";
			toSet += "<input type='submit' ng-model='manualLocation(location)'";
			toSet += "</form>";
			locationDiv.innerHTML = toSet;
		}
	};

	factory.request = function (callback) {
		console.log(userLatitude);
		console.log(userLongitude);
		$http.post('/price', { start_latitude: startLatitude, start_longitude: startLongitude, end_latitude: userLatitude, end_longitude: userLongitude}).success(function (output) {
			callback(output);
		});
	};

	factory.getPets = function (callback) {
		var data = { "animal": "dog", "location": "94022", "age" : "senior", "count" : "3" };
		$http({ url: '/petfinder/pets', method: 'GET', params: data }).success(function (output) {
			console.log("OUTPUT IN getPets FACTORY METHOD", output);
			callback(output);
		});

	};

	return factory;
});

//Place Controllers here
petPals.controller('welcomeController', function ($scope, petFactory, $window) {
	$scope.search = function () {
		$window.location.assign('#/main');
	};
});

petPals.controller('mainController', function ($scope, petFactory, $window) {

	var ex_options = { "query": { "animal": "dog", "location": "94022", "age" : "senior", "count" : "2" }};

	petFactory.getPets(function (output) {
		console.log("OUTPUT IN GET PET CONTROLLER");
		$scope.pets = output;
		console.log("\n","SCOPE.PETS",$scope.pets);
	});

	petFactory.getLocation(function (data) {
		$scope.location = data;
	});

	$scope.select = function () {
		$window.location.assign('#/pet');
	};

});

petPals.controller('petController', function ($scope, petFactory, $window) {
	petFactory.getLocation(function (data) {
		$scope.location = data;
	})

	$scope.goBack = function () {
		$window.location.assign('#/main')
	}

	$scope.request = function () {
		petFactory.request(function (data) {
			console.log(data);
		})
		// $window.location.assign('#/finished')
	}
})

petPals.controller('finishedController', function ($scope, petFactory, $window) {

})