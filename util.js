const fetch = require('node-fetch');
const url = require('url');
const SocialAuthModel = require('./models/SocialAuth');

function getIpAddress(req) {
	let ipAddress = req.headers['x-forwarded-for'];
	if(ipAddress){
		if (ipAddress.substr(0, 7) == "::ffff:") {
			ipAddress = ipAddress.substr(7);
		}
	}else{
		ipAddress = "162.243.3.149";
	}
	return ipAddress;
}

async function sendGetRequest(url) {
	let response = await fetch(url);
	let json = await response.json();

	return json;
}

async function sendPostRequest(url, data) {
	let response = await fetch(url, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	});

	let json = await response.json();

	return json;
}

let setup = (req, res, next) => {
	req.session.user = req.session.user ?? {};
	next();
};

function getLanguage(req, cb){
	getCountryCode(getIpAddress(req), response => {
		let lang = response.status == "success" ? getLanguageFromCountryCode(response.countryCode) : "EN";
		cb(lang);
	});
}

function getLanguageFromCountryCode(countryCode){
	switch(countryCode){
		case "TW":
		case "CN":
		case "HK":
			return "TW";

		case "IN":
			return "HI";

		case "ES":
		case "AR":
			return "ES";

		case "DE":
			return "DE";

		case "MY":
			return "MY";

		default:
			return "EN";

	}
}

let ipAddressCache = {};
function getCountryCode(ipAddress, callback) {
	if (ipAddressCache[ipAddress]) {
		callback(ipAddressCache[ipAddress]);
	} else {
		let lookupAgent = `http://ip-api.com/json/${ipAddress}?fields=status,message,countryCode`;
		sendGetRequest(lookupAgent)
		.then(json => {
			if (json.status == "success") {
				let response = { status: "success", countryCode: json.countryCode };
				if(Object.keys(ipAddressCache).length > 100){
					ipAddressCache = {};
				}
				ipAddressCache[ipAddress] = response;
				callback(response);
			} else {
				console.error("ip resolution error : " + json.message);
				callback({ status: 'failed' });
			}
		}).catch(err => {
			//console.error(err);
			callback({ status: 'failed' });
		});
	}
}

function isUserLoggedIn(req) {
	let isLoggedIn = false;

	if (req.session.user.sessionId) {
		isLoggedIn = true;
	} else {
		if (req.cookies['sharetxtSessionId']) {
			req.session.user.sessionId = req.cookies['sharetxtSessionId'];
			isLoggedIn = true;
		}
	}

	return isLoggedIn;
}

function isEmailValid(email) {
	const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(String(email).toLowerCase());
}

function getHostUrl(req) {
	return url.format({
		protocol: req.protocol,
		host: req.get('host')
	});
}

function getRandom(min, max) {
	return myMap(Math.random(), 0, 1, min, max);
}

function myMap(val, minF, maxF, minT, maxT) {
	return minT + (((val - minF) / (maxF - minF)) * (maxT - minT));
}

function isSocialAuthAvailable(req) {
	let isAvailable = false;

	if (req.session.socialSessionId) {
		isAvailable = true;
	} else {
		if (req.cookies['socialSessionId']) {
			req.session.socialSessionId = req.cookies['socialSessionId'];
			isAvailable = true;
		}
	}

	return isAvailable;
}

function getSocialAuth(req, cb) {
	if(isSocialAuthAvailable(req)){
		SocialAuthModel.findOne({ socialSessionId: req.session.socialSessionId }, (err, doc) => {
			if(err || doc == null) return cb(null);
			cb(doc);
		});
	}else{
		cb(null);
	}
}

module.exports = {
	sendPostRequest,
	setup,
	getLanguage,
	isUserLoggedIn,
	isEmailValid,
	getHostUrl,
	getRandom,
	getSocialAuth
};