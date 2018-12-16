/**
 * 
 */
//Import the installed modules.
var express = require('express')
var responseTime = require('response-time')
var axios = require('axios')
var redis = require('redis')

var app = express()

//create and connect redis client to local instance.
const client = redis.createClient();
// Comment above line and uncomment below to connect to RLEC DB's and use the parameters based on your DB setup
//client = redis.createClient({
//port : 13042, // replace with your port
//host : 'redis-13042.cluster1.virag.demo-rlec.redislabs.com' //, // replace
//with your hostanme or IP address
//password : 'redis', // replace with your password
// optional, if using SSL
// use `fs.readFile[Sync]` or another method to bring these values in
//tls : {
//key : stringValueOfKeyFile,
//cert : stringValueOfCertFile,
//ca : [ stringValueOfCaCertFile ]
//}
//});

//Print redis errors to the console
client.on('error', (err) => {
	console.log("Error " + err);
});

//use response-time as a middleware. check the value in X-Response-Time in the custom header response
app.use(responseTime());


//create an api/search route
app.get('/api/search', (req, res) => {
	var body = '';
	var resultJSON = '';
	// Extract the query from url and trim trailing spaces
	const make = (req.query.make).trim();
	const year = (req.query.year).trim();
	// Build the NHTSA API URL
	const searchUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformakeyear/make/${make}/modelyear/${year}?format=json`;

	// Try fetching the result from Redis first in case we have it cached
	const resultObj = client.hgetall(`vehicle:${make}:${year}`);
	return client.hgetall(`vehicle:${make}:${year}`, (err, resultJSON) => {
		// If that key exist in Redis store
		if (resultJSON) {
			res.on('data', function(chunk) {
				body += chunk;
			});
			res.on('end', function() {
				resultJSON = JSON.parse(body)
			});
			return res.status(200).json(resultJSON);
		} else { // Key does not exist in Redis cache
			// Fetch directly from NHTSA API
			return axios.get(searchUrl)
			.then(response => {
				const responseJSON = response.data;
				// Save the NHTSA API response in Redis DB
				client.hmset(`vehicle:${make}:${year}`, "RedisCacheResponse", JSON.stringify({ source: 'Redis Cache', ...responseJSON, }));
				// Send JSON response to client
				return res.status(200).json({ source: 'National Highway Traffic Safety Administration Vehicle API', ...responseJSON, });
			})
			.catch(err => {
				return res.json(err);
			});
		}
	});
});

app.listen(3000, () => {
	console.log('Server listening on port: ', 3000);
});
