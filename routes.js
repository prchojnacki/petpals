var petfinder = require('./petfinder.js');
var https = require('https');
module.exports = function(app) {
  /* Part of the Petfinder API */
  app.get('/petfinder/pets', function (req, res) {
    // console.log("REQ OBJECT IN /petfinder/pets", req);
    petfinder.pet.find(req, res);
  });
  app.get('/petfinder/shelters', function (req, res) {
  petfinder.shelter.get(req.query.id, function(shelter){
  	// console.log(shelter);
    res.json(shelter);
  });
});
};