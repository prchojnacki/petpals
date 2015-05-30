var express = require('express');
var session = require('express-session');
var passport = require('passport');
var https = require('https');
var bodyParser = require('body-parser');
var app = express();
var config = require('./config.js');
var MD5 = require('MD5');

var secret = config.petfinderSecret;

var http = require("http");
var url = require("url");
var _ = require('underscore');

function Petfinder () {

  var self = this;
  self.KEY = config.petfinder_api_key;

  self.options = function(opts) {
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
    findPets: function(opts, callback) {
      var options = self.options(opts);
      _.extend(options, { "pathname": "/pet.find" });
      // console.log("\n","OPTIONS IN FIND PETS", options);
      self.getRequest(options, callback);
    },

    getPet: function(opts, callback) {
      var options = self.options(opts);
      _.extend(options, { "pathname": "/pet.get" });
      // console.log("\n","OPTIONS IN GET PET", options);
      self.getRequest(options, callback);
    },
  };

};

  var pet_finder = new Petfinder();

  // Find 5 senior dogs in my neighborhood 94022 (Los Altos, CA) area.
  pet_finder.pet.findPets({ "query": { "animal": "dog", "location": "94022", "age" : "senior", "count" : "5" }}, function (data) {
    _.each(data.petfinder.pets, function (a_pet) {
      console.log("A_PET", a_pet);
    });
    return data.petfinder.pets.pet;
  });

  // Get a pet by its numeric id.
  pet_finder.pet.getPet({ "query": { "id": 24395698 } }, function (data) {
    console.log('PET BY ID', data);
    return data;
  });


