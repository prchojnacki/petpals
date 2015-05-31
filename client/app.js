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
	var requestedPet;
	var selectedPet;
	var pets;
	var shelters = [];

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

	factory.getPets = function (specs, callback) {
		//get and set pets
		if(specs == '') {
			var data = { "location": "94022", "count": "16" };
		}
		else {
			var data = { "animal": specs.animal, "breed": specs.breed, "size": specs.size, "sex": specs.sex, "location": "94022", "age" : specs.age, "count" : "16" };
		}
		$http({ url: '/petfinder/pets', method: 'GET', params: data }).success(function (output) {
			// console.log(output);
			pets = output;
			console.log(pets);
			var temp = [];
			var count = 0;
			for (pet in output) {
				// if (temp.output[pet].shelterId==-1) {
					temp.push(output[pet].shelterId);
					if (typeof(output[pet].shelterId) == 'undefined') {
						var data = { "id": "CA1437" }
					} else {
						var data = { "id": output[pet].shelterId };
					}
					$http({ url: '/petfinder/shelters', method: 'GET', params: data }).success(function (petfinderShelter) {
						var endLatitude = petfinderShelter.latitude;
				    	var endLongitude = petfinderShelter.longitude;
				        var SID = petfinderShelter.id;
				        $http.post('/price', {start_latitude: userLatitude, start_longitude: userLongitude, end_latitude: endLatitude, end_longitude: endLongitude}).success(function (uberPrice) {
				        	p = uberPrice.prices[0].estimate;
				        	d = uberPrice.prices[0].distance;
							shelters.push({shelterId: SID, price: p, distance: d});

							count ++;
							if(count==pets.length-1) {
								callback(shelters, pets);
							}
						});
				    });
				// }
				// else {
				// 	count ++;

				// }
				// if(count == pets.length-1) {
				// 	console.log(shelters);
				// 	callback(shelters, pets);
				// }
			}
		});
	};

	factory.request = function (pet, callback) {
 		$http.get('/auth/isAuthenticated').success(function (output) {
 			if (output == true) {
 				console.log("WOOOT");
 				$http.post('/request', {start_latitude: userLatitude, start_longitude: userLongitude, end_latitude: pet.latitude, end_longitude: pet.longitude}).success(function (rideoutput) {
 					ride = rideoutput;
 					requestedPet = pet;
					callback(rideoutput);
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

	petFactory.getLocation(function (data) {
		$scope.location = data;
		petFactory.getPets ("",function (shelters, pets) {
		// petFactory.getPets ("",function (pets) {
			$scope.shelters = shelters;
			$scope.pets = pets;
			for (var i = 0; i < $scope.pets.length; i++) {
				for (var j = 0; j < $scope.shelters.length; j++) {
					if ($scope.pets[i].shelterId == $scope.shelters[j].shelterId) {
						$scope.pets[i].price = $scope.shelters[j].price;
						$scope.pets[i].distance = $scope.shelters[j].distance;
						$scope.pets[i].latitude = $scope.shelters[j].latitude;
						$scope.pets[i].longitude = $scope.shelters[j].longitude;
					} else {
						continue;
					}
				}
			}
		})
	})

	$scope.search = function (params) {
		console.log("PARAMS IN SEARCH", params);
		petFactory.getPets (params, function (shelters, pets) {
			$scope.shelters = shelters;
			$scope.pets = pets;
			for (var i = 0; i < $scope.pets.length; i++) {
				for (var j = 0; j < $scope.shelters.length; j++) {
					if ($scope.pets[i].shelterId == $scope.shelters[j].shelterId) {
						$scope.pets[i].price = $scope.shelters[j].price;
						$scope.pets[i].distance = $scope.shelters[j].distance;
						$scope.pets[i].latitude = $scope.shelters[j].latitude;
						$scope.pets[i].longitude = $scope.shelters[j].longitude;
					} else {
						continue;
					}
				}
			}
		})
	}

	$scope.select = function (id) {
		for (pet in $scope.pets) {
			if ($scope.pets[pet].id == id) {
				$scope.selectedPet = $scope.pets[pet];
				console.log($scope.selectedPet);
			}
		}
	}

	$scope.request = function () {
		petFactory.request($scope.selectedPet, function (data) {
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