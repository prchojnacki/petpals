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

//Factories
petPals.factory('petFactory', function ($http, $window) {
	var factory = {};
	var userLatitude;
	var userLongitude;
	var ride;
	var selectedPetName;

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
			toSet += "<input type='submit' ng-model='manualLocation(location)'";
			toSet += "</form>";
			locationDiv.innerHTML = toSet;
		}
	};

	factory.getPets = function (callback) {
		//get and set pets
		var data = { "animal": "dog", "location": "94022", "age" : "senior", "count" : "3" };
		$http({ url: '/petfinder/pets', method: 'GET', params: data }).success(function (output) {
			console.log("OUTPUT IN getPets FACTORY METHOD", output);
			for (pet in output) {
				//get shelter location - set endLatitude/endLongitude
				var endLatitude = output[pet].location.latitude;
				var endLongitude = output[pet].location.longitude;
				//get uber estimate of cost and distance
				$http.post('/price', {start_latitude: userLatitude, start_longitude: userLongitude, end_latitude: endLatitude, end_longitude: endLongitude}).success(function (output) {
					output[pet].price = price.prices[0].estimate;
					output[pet].distance = price.prices[0].distance;
				});
			}
			callback(output);
		});
	};

	factory.request = function (callback) {
 		$http.get('/auth/isAuthenticated').success(function (output) {
 			if (output == true) {
 				console.log("WOOOT");
 				$http.post('/request', {start_latitude: startLatitude, start_longitude: startLongitude, end_latitude: userLatitude, end_longitude: userLongitude}).success(function (rideoutput) {
 					ride = rideoutput;
 					//set pet's name selectedPetName = 
					callback(rideoutput, selectedPetName);
				})
 			} else {
 				$window.location.assign('/auth/uber');
 			}
 		});		
	}

	factory.getRide = function (callback) {
		callback(ride, selectedPetName);
	}

	return factory;
});

//Controllers
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
		petFactory.getPets (function (pets) {
			$scope.pets = pets;
		})
	})

	$scope.select = function () {
		//add pet information to $scope
	}

	$scope.request = function () {
		petFactory.request(function (data) {
			console.log('rideoutput',data);
			$window.location.assign('#/finished');
		})
	}
})

petPals.controller('finishedController', function ($scope, petFactory, $window) {
	petFactory.getRide(function (ride, pet_name) {
		$scope.eta = ride.eta;
		$scope.pet_name = pet_name;
	})
})