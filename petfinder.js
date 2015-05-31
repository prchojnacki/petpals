var config = require('./config.js');
var MD5 = require('MD5');
var secret = config.petfinderSecret;
var http = require("http");
var url = require("url");
var _ = require('underscore');

function Petfinder () {

  var self = this;
  self.KEY = config.petfinder_api_key;

  self.options = function (opts) {
    var options = {
      "protocol": "http:",
      "host": "api.petfinder.com",
      "query": { "format": "json", "key": self.KEY }
    };
    //What's wrong with doing the following?
    /*
    opts.protocol = "http";
    opts.host = "api.petfinder.com"
    opts.query.format = "json";
    opts.query.key = self.KEY;
    */

    // I'm using underscore.js to combine these objects...
    // Just trust me, we need it.
    _.defaults(options.query, opts.query);
    _.defaults(options, opts);
    return options;
  };

  self.getRequest = function (opts, callback) {
    var new_url = url.format(self.options(opts));
    http.get(new_url, function (res) {
      var data = "";
      res.on("data", function (val) {
        data += val.toString();
      });
      res.on("end", function () {
        callback(JSON.parse(data));
      });
    });
  };

  self.pet = {
    find: function (req, res) {
      var new_query = self.options({query: req.query});
      _.extend(new_query, { "pathname": "/pet.find" });
      var all_pets = [];
      self.getRequest(new_query, function (results) {
        for (var i = 0; i < results.petfinder.pets.pet.length; i++) {
          var new_pet = self.pet.clean(results.petfinder.pets.pet[i]);
          all_pets.push(new_pet);
        };
        res.json(all_pets);
      });
    },
    get: function (opts, callback) {
      var options = self.options(opts);
      _.extend(options, { "pathname": "/pet.get" });
      self.getRequest(options, callback);
    },
    clean: function(pet){
      var photos = [];
      var options = [];
      for(var i in pet.media.photos.photo){
      	if (pet.media.photos.photo[i]['@size'] == 'x') {
      		photos.push(pet.media.photos.photo[i].$t);
      	}
      }
      for(i in pet.options.option){
        options.push(pet.options.option[i]);
      }
      return {
        animal:       pet.animal.$t,
        age:          pet.age.$t,
        breed:        pet.breeds.breed.$t,
        contact:      {
                        email: pet.contact.email.$t,
                        phone:pet.contact.phone.$t
                      },
        description:  pet.description.$t,
        name:         pet.name.$t,
        options:      options,
        photos:       photos,
        sex:          pet.sex.$t,
        shelterId:    pet.shelterId.$t,
        id:           pet.id.$t
      };
    }
  };

  self.shelter = {
    get: function (id, callback) {
      var opts = { "query" : { "id": id } };
      var options = self.options(opts);
      _.extend(options, { "pathname": "/shelter.get" });
      self.getRequest(options, function(results){
        var output = self.shelter.clean(results.petfinder.shelter);
        callback(output);
      });
    },
    clean: function(shelter){
    	console.log("shelter:", shelter);
      return {
        longitude: shelter.longitude.$t,
        latitude: shelter.latitude.$t,
        id: shelter.id.$t
      };
    }
  };
};

module.exports = new Petfinder();

//-------------------------- ROUTES -------------------------- //

// Find 5 senior dogs in my neighborhood 94022 (Los Altos, CA) area.
// pet_finder.pet.find({ "query": { "animal": "dog", "location": "94022", "age" : "senior", "count" : "3" }}, function (data) {
//   return data.petfinder.pets;
// });

// pet_finder.shelter.get({ "query": { "id": "CA912" } }, function (data) {
//   console.log("REQUEST SHELTERS LOS ALTOS", data);
//   return data.petfinder.shelter;
// });

// Get a pet by its numeric id.
// pet_finder.pet.get({ "query": { "id": 24395698 } }, function (data) {
//   // console.log('PET BY ID', data);
//   return data;
// });
