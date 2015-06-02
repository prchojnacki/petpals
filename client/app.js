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
	var userZip;

	var locationDiv = document.getElementById('location');

	//send user to login to their Uber account using oauth
	factory.authenticate = function () {
		$http.get('/auth/isAuthenticated').success(function (output) {
 			console.log('came back',output);
 			if (output == true) {
 				console.log("WOOOT");
 				$window.location.assign('/#main');	
 			} else {
 				console.log('hi');
 				$window.location.assign('/auth/uber');
 			}
 		});
	}

	//get user's position, then use Google's geocoding API to get the user's zip code
	factory.getLocation = function (callback) {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function (position) {
				userLatitude = position.coords.latitude;
				userLongitude = position.coords.longitude;
				$http.post('/zip', {latitude: userLatitude, longitude: userLongitude}).success(function (geocoded) {
					userZip = geocoded.results[0].address_components[7].short_name;
					callback(position);
				});
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

	//use the user's zip code to lookup nearby pets using the Petfinder API
	factory.getPets = function (specs, callback) {
		//get and set pets
		if(specs == '') {
			var data = { "location": userZip, "count": "16" };
		}
		else {
			var data = { "animal": specs.animal, "breed": specs.breed, "size": specs.size, "sex": specs.sex, "location": userZip, "age" : specs.age, "count" : "16" };
		}
		$http({ url: '/petfinder/pets', method: 'GET', params: data }).success(function (output) {
			// console.log(output);
			pets = output;
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
					//get the shelter where each pet is located
					$http({ url: '/petfinder/shelters', method: 'GET', params: data }).success(function (petfinderShelter) {
						var endLatitude = petfinderShelter.latitude;
				    	var endLongitude = petfinderShelter.longitude;
				        var SID = petfinderShelter.id;
				        //get the price of an Uber to that shelter
				        $http.post('/price', {start_latitude: userLatitude, start_longitude: userLongitude, end_latitude: endLatitude, end_longitude: endLongitude}).success(function (uberPrice) {
				        	if (typeof(uberPrice.prices) == "undefined") {
				        		p = "Unknown";
				        		d = "Unknown";
				        	} else {
				        		p = uberPrice.prices[0].estimate;
				        		d = uberPrice.prices[0].distance;
				        	}
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

	//make a request to the Uber API for a car to get to the selected pet
	factory.request = function (pet, callback) {
		requestedPet = pet;
		$http.post('/request', {start_latitude: userLatitude, start_longitude: userLongitude, end_latitude: pet.latitude, end_longitude: pet.longitude}).success(function (rideoutput) {
			ride = rideoutput;
			callback(rideoutput);
		})
	}

	//send the ride and requested pet information to the finished controller
	factory.getRide = function (callback) {
		callback(ride, requestedPet);
	}

	//logout of the Uber API
	factory.logout = function () {
		$http.get('/logout');
	}

	return factory;
});

//Controllers
petPals.controller('welcomeController', function ($scope, petFactory, $window) {
	//send the user to sign in to their Uber account to be able to make requests for a ride
	$scope.search = function () {
		petFactory.authenticate();
		// $window.location.assign('#/main');
	};
});

petPals.controller('mainController', function ($scope, petFactory, $window) {

	//get the user's location upon page load, and use the location to find nearby pets
	petFactory.getLocation(function (data) {
		$scope.location = data;
		petFactory.getPets ("",function (shelters, pets) {
		// petFactory.getPets ("",function (pets) {
			$scope.shelters = shelters;
			$scope.pets = pets;
			//match up pets with their shelters using shelter Id
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

	//user can enter parameters to search for pets by
	$scope.search = function (params) {
		console.log("PARAMS IN SEARCH", params);
		if (params.age == 'Any') { delete params.age; }
		if (params.sex == 'Any') { delete params.sex; }
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

	//choose a pet to see it's details
	$scope.select = function (id) {
		for (pet in $scope.pets) {
			if ($scope.pets[pet].id == id) {
				$scope.selectedPet = $scope.pets[pet];
				console.log($scope.selectedPet);
			}
		}
	}

	//switch between thumbnails on a pet's description page
	$scope.switchPhoto = function (photo) {
		for (p in $scope.selectedPet.photos) {
			if ($scope.selectedPet.photos[p] == photo) {
				$scope.selectedPet.photos[p] = $scope.selectedPet.photos[0];
			}
		}
		$scope.selectedPet.photos[0] = photo;
	}

	//make a request for a ride to visit this pet
	$scope.request = function () {
		petFactory.request($scope.selectedPet, function (data) {
			$window.location.assign('#/finished');
		})
	}
})

petPals.controller('finishedController', function ($scope, petFactory, $window) {
	//on page load, get the details of the requested ride and pet
	petFactory.getRide(function (ride, pet) {
		$scope.eta = ride.eta;
		$scope.pet = pet;
	})

	//logout of uber account
	$scope.logout = function () {
		petFactory.logout();
	}
})