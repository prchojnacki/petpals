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
			var data = {"location": "94022", "count": "8"};
		}
		else {
			var data = { "animal": specs.animal, "breed": specs.breed, "size": specs.size, "sex": specs.sex, "location": "94022", "age" : specs.age, "count" : "8" };
		}
		$http({ url: '/petfinder/pets', method: 'GET', params: data }).success(function (output) {
			pets = output;
			var temp = [];
			var count = 0;
			for (pet in output) {
				// if (temp.output[pet].shelterId==-1) {
					temp.push(output[pet].shelterId);
					var data = {"id":output[pet].shelterId};
					$http({ url: '/petfinder/shelters', method: 'GET', params: data }).success(function (petfinderShelter) {
						var endLatitude = petfinderShelter.petfinder.shelter.latitude.$t;
				    	var endLongitude = petfinderShelter.petfinder.shelter.longitude.$t;
				        var SID = petfinderShelter.petfinder.shelter.id.$t;
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

	petFactory.getLocation(function (data) {
		$scope.location = data;
		petFactory.getPets ("",function (shelters, pets) {
			$scope.shelters = shelters;
			$scope.pets = pets;
			for (var i = 0; i < $scope.pets.length; i++) {
				for (var j = 0; j < $scope.shelters.length; j++) {
					if ($scope.pets[i].shelterId == $scope.shelters[j].shelterId) {
						$scope.pets[i].price = $scope.shelters[j].price;
						$scope.pets[i].distance = $scope.shelters[j].distance;
					} else {
						continue;
					}
				}
			}
		})
	})

	$scope.search = function (params) {
		petFactory.getPets (params, function (shelters, pets) {
			$scope.shelters = shelters;
			$scope.pets = pets;
			for (var i = 0; i < $scope.pets.length; i++) {
				for (var j = 0; j < $scope.shelters.length; j++) {
					if ($scope.pets[i].shelterId == $scope.shelters[j].shelterId) {
						$scope.pets[i].price = $scope.shelters[j].price;
						$scope.pets[i].distance = $scope.shelters[j].distance;
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