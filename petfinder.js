var express = require('express');
var session = require('express-session');
var passport = require('passport');
var https = require('https');
var bodyParser = require('body-parser');
var app = express();
var config = require('./config.js');
var MD5 = require('MD5');


var key = config.petfinder_api_key;
var secret = config.petfinderSecret;

function getSessionToken(req, res) {
  var sig = MD5(secret+'key='+key);
  app.get('http://api.petfinder.com/auth.getToken?'+sig, function (request, response) {
    console.log(res.json(response));
  });
}

getSessionToken();

var server = app.listen(8000, function(){
  console.log('listening to port: 8000');
});

