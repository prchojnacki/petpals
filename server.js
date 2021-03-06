// UBER API STARTER KIT FOR NODE/EXPRESS
// We use passport to handle oauth for uber, passport uses express-session, and we use the passport-uber strategy. Https for sending api requests from our server and bodyparser for post data.
var express = require('express');
var session = require('express-session');
var passport = require('passport');
var uberStrategy = require('passport-uber');
var https = require('https');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var config = require('./config.js');
var petfinder = require('./petfinder.js');

require('./routes.js')(app);
// ClientID & ClientSecret for API requests with OAUTH
var clientID = config.ClientID;
var clientSecret = config.ClientSecret;
// ServerID for API requests without OAUTH
var ServerID = config.ServerID;
// sessionSecret used by passport
var sessionSecret = "UBERAPIROCKS";

app.use(session({
	secret: sessionSecret,
	resave: false,
	saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/client'));

// post to show unauthorized request
app.post('/cars', function(request, response) {
  getRequest('/v1/products?latitude='+request.body.start_latitude+'&longitude='+request.body.start_longitude, function(err, res) {
    response.json(res);
  });
});

//get Uber price estimates
app.post('/price', function (request, response) {
  getRequest('/v1/estimates/price?start_latitude='+request.body.start_latitude+'&start_longitude='+request.body.start_longitude+'&end_latitude='+request.body.end_latitude+'&end_longitude='+request.body.end_longitude, function (err, res) {
    if(err) {
      console.log('err',err);
      console.log('res', res);
    }
    else {
      response.json(res);
    }
  })
})

//get the user's zip code based on their latitude and longitude
app.post('/zip', function (request, response) {
  googleGet (request.body.latitude, request.body.longitude, function (err, res) {
    if(err) {
      console.log('err', err);
      console.log('res', res);
    }
    else {
      response.json(res);
    }
  })
})

//helper function to get the user's zip
function googleGet (latitude, longitude, callback) {
  var options = {
    hostname: "maps.googleapis.com",
    path: "/maps/api/geocode/json?latlng=" + latitude + "," + longitude + "&key=" + config.google_api_key
  }

  var req = https.request(options, function (res) {
    var fullRes = ""
    res.setEncoding('utf8');
    res.on('readable', function() {
      var chunk = this.read() || '';
      fullRes += chunk;
      console.log('chunk: ' + Buffer.byteLength(chunk) + ' bytes')
    });
    res.on('end', function() {
      callback(null, JSON.parse(fullRes));
    });
  });
  req.end();
  req.on('error', function (err) {
    callback(err, null);
  });
}

// use this for an api get request without oauth (in our case, the price of an uber ride)
function getRequest(endpoint, callback) {
  var options = {
    hostname: "sandbox-api.uber.com",
    path: endpoint,
    method: "GET",
    headers: {
      'Content-Type': 'application/json',
      Authorization: "Token " + ServerID
    }
  }

  var req = https.request(options, function(res) {
    var fullRes = ""
    res.setEncoding('utf8');
    res.on('readable', function() {
      var chunk = this.read() || '';
      fullRes += chunk;
      console.log('chunk: ' + Buffer.byteLength(chunk) + ' bytes')
    });
    res.on('end', function() {
      callback(null, JSON.parse(fullRes));
    });

  });
  req.end();

  req.on('error', function(err) {
    callback(err, null);
  });
}

// _______________ BEGIN PASSPORT STUFF ________________
// Serialize and deserialize users used by passport
passport.serializeUser(function (user, done){
	done(null, user);
});
passport.deserializeUser(function (user, done){
	done(null, user);
});

// define what strategy passport will use -- this comes from passport-uber
passport.use(new uberStrategy({
		clientID: clientID,
		clientSecret: clientSecret,
		callbackURL: "http://localhost:8000/auth/uber/callback"
	},
	function (accessToken, refreshToken, user, done) {
		// console.log('user:', user.first_name, user.last_name);
		// console.log('access token:', accessToken);
		// console.log('refresh token:', refreshToken);
    // THIS IS WHERE YOU WOULD PUT SOME DB LOGIC TO SAVE THE USER
		user.accessToken = accessToken;
		return done(null, user);
	}
));

//determine if the user has been authenticated already
app.get('/auth/isAuthenticated', function(req, res) {
  res.send(req.isAuthenticated());
});

// get request to start the whole oauth process with passport
app.get('/auth/uber',
  passport.authenticate('uber',
    { scope: ['profile', 'request'] }
  )
);

// authentication callback redirects to / if authentication failed or main if successful
app.get('/auth/uber/callback',
	passport.authenticate('uber', {
		failureRedirect: '/'
	}), function(req, res, next) {
    res.redirect('/#/main');
  });

app.get('/',function(req,res){
  res.sendFile('index.html',{root: __dirname + '/client/'},function(err){
    if(err){
      res.status(err.status).end();
    }
  })
});
// /profile API endpoint
app.get('/profile', ensureAuthenticated, function (request, response) {
	getAuthorizedRequest('/v1/me', request.user.accessToken, function (error, res) {
		if (error) { console.log(error); }
		response.json(res);
	});
});

// /history API endpoint
app.get('/history', ensureAuthenticated, function (request, response) {
	getAuthorizedRequest('/v1.2/history', request.user.accessToken, function (error, res) {
		if (error) { console.log("err", error); }
    console.log(res);
		response.json(res);
	});
});

// ride request API endpoint
app.post('/request', ensureAuthenticated, function (request, response) {
  console.log('in /request');
	// NOTE! Keep in mind that, although this link is a GET request, the actual ride request must be a POST, as shown below
	var parameters = {
		start_latitude : request.body.start_latitude,
		start_longitude: request.body.start_longitude,
		end_latitude: request.body.end_latitude,
		end_longitude: request.body.end_longitude,
		product_id: "a1111c8c-c720-46c3-8534-2fcdd730040d"
	};

	postAuthorizedRequest('/v1/requests', request.user.accessToken, parameters, function (error, res) {
		if (error) { console.log(error); }
		response.json(res);
	});
});

// logout
app.get('/logout', function (request, response) {
	request.logout();
	response.redirect('/');
});

// route middleware to make sure the request is from an authenticated user
function ensureAuthenticated (request, response, next) {
  console.log('inside ensure Authenticated');
	if (request.isAuthenticated()) {
    console.log("Authenticated!");
		return next();
	} else {
    response.redirect('/auth/uber/callback')
  }
  console.log("Not authenticated?");
	response.redirect('#/welcome');
}
// use this for an api get request
function getAuthorizedRequest(endpoint, accessToken, callback) {
  var options = {
    hostname: "sandbox-api.uber.com",
    path: endpoint,
    method: "GET",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Origin": "https://login.uber.com/oauth/"
    }
  }
  var req = https.request(options, function(res) {
    res.on('data', function(data) {
      console.log('data!');
      console.log(JSON.parse(data));
      callback(null, JSON.parse(data));
    })
  })
  req.end();
  req.on('error', function(err) {
    callback(err, null);
  });
}
// use this for an api post request
function postAuthorizedRequest(endpoint, accessToken, parameters, callback) {
  var options = {
    hostname: "sandbox-api.uber.com",
    path: endpoint,
    method: "POST",
    headers: {
      Authorization: "Bearer " + accessToken,
      'Content-Type': 'application/json', 
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Origin": "https://login.uber.com/oauth/authorize"
    }
  }
  var req = https.request(options, function(res) {
    res.on('data', function(data) {
      console.log('data!');
      console.log(JSON.parse(data));
      callback(null, JSON.parse(data));
    })
  })
  req.write(JSON.stringify(parameters));
  req.end();
  req.on('error', function(err) {
    callback(err, null);
  });
}


// start server
var server = app.listen(8000, function() {
	console.log("\n",'listening to port: 8000',"\n");
});
