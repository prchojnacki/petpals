var config = require('./config.js');
var MD5 = require('MD5');
var secret = config.petfinderSecret;
var http = require("http");
var url = require("url");
var _ = require('underscore');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
var petfinder = require('./petfinder.js');
// var routes = require('./routes.js')(app);

function Petfinder () {

  var self = this;
  self.KEY = config.petfinder_api_key;

  self.options = function (opts) {
    var options = {
      "protocol": "http:",
      "host": "api.petfinder.com",
      "query": { "format": "json", "key": self.KEY }
    };
    // I'm using underscore.js to combine these objects...
    // Just trust me, we need it.
    _.defaults(options.query, opts.query);
    _.defaults(options, opts);
    return options;
  };


  self.getSessionToken = function (opts) {
    var token_string = 'http://api.petfinder.com/auth.getToken?key='+key+'&sig='+MD5(secret+'key='+key)+'/';
    var getRes = https.get(token_string,function (res){
      res.on('data', function (data) {
        var xmlString = data.toString('utf-8');
        token = xmlString.substring(xmlString.indexOf("<token>")+"<token>".length,xmlString.indexOf("</token>"));
      });
    });
    getRes.on('error', function (err) {
      console.log(err);
    });
    getRes.end();
  };

  self.getRequest = function (opts, callback) {
    var new_url = url.format(self.options(opts));
    console.log("\n","URL", new_url);
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
      var new_query = self.options(req);
      _.extend(new_query, { "pathname": "/pet.find" });
      self.getRequest(new_query, function (results) {
        var all_pets = [];
        for (var i = 0; i < results.petfinder.pets.pet.length; i++) {
          console.log("RESULTS PET IN GET REQUEST",results.petfinder.pets.pet[i]);
          all_pets.push(self.makeFriendly.pet(results.petfinder.pets.pet[i]));
        }
        console.log("ALL PETS", "\n", all_pets, "\n");
        res.json(all_pets);
      });
    },

    get: function (opts, callback) {
      var options = self.options(opts);
      _.extend(options, { "pathname": "/pet.get" });
      self.getRequest(options, callback);
    }

  };

  self.shelter = {
    get: function (opts, callback) {
      var options = self.options(opts);
      _.extend(options, { "pathname": "/shelter.get" });
      self.getRequest(options, callback);
    }
  };

  self.makeFriendly = {

    pet: function (obj) {

      console.log("\n","OBJ.ANIMAL IN MAKE FRIENDLY", "\n", obj.animal.$t);
      var petObj = {};
      petObj.animal = obj.animal.$t;
      petObj.age = obj.age.$t;
      petObj.name = obj.name.$t;
      petObj.breed = obj.breeds.breed.$t;
      petObj.address =
        obj.contact.address1.$t + " " +
        obj.contact.address2.$t + " " +
        obj.contact.city.$t + " " +
        obj.contact.state.$t + ", " +
        obj.contact.zip.$t;
      petObj.description = obj.description.$t;
      petObj.phone = obj.contact.phone.$t;
      petObj.email = obj.contact.email.$t;

      var petPhotos = [];
      for (var i = 0; i < obj.media.photos.photo.length; i++) {
        petPhotos.push(obj.media.photos.photo[i].$t);
      }
      petObj.photos = petPhotos;

      var petOptions = [];
      for (var j = 0; j < obj.options.option.length; j++) {
        petOptions.push(obj.options.option[j].$t);
      }
      petObj.options = petOptions;
      petObj.sex = obj.sex.$t;

      // function getShelter(shelterId) {
      //   self.shelter.get({ "query" : { "id": shelterId }}, function (obj) {
      //     console.log("OBJ IN SHELTER GET REQUEST", obj);
      //     shelterLocation = {};
      //     shelterLocation.longitude = obj.shelter.longitude.$t;
      //     shelterLocation.latitude = obj.shelter.latitude.$t;
      //     return shelterLocation;
      //   });
      // };
      // petObj.location = getShelter(obj.shelterId.$t);

      return petObj;
    }
  };
};

var pet_finder = new Petfinder();

module.exports = pet_finder;

//-------------------------- ROUTES -------------------------- //

// Find 5 senior dogs in my neighborhood 94022 (Los Altos, CA) area.
// pet_finder.pet.find({ "query": { "animal": "dog", "location": "94022", "age" : "senior", "count" : "3" }}, function (data) {
//   return data.petfinder.pets;
// });

pet_finder.shelter.get({ "query": { "id": "CA912" } }, function (data) {
  console.log("REQUEST SHELTERS LOS ALTOS", data);
  return data.petfinder.shelter;
});

// Get a pet by its numeric id.
// pet_finder.pet.get({ "query": { "id": 24395698 } }, function (data) {
//   // console.log('PET BY ID', data);
//   return data;
// });





