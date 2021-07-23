const fetch = require('node-fetch');

function getIpAddress(req) {
	let ipAddress = req.headers['x-forwarded-for'];
	if(ipAddress){
		if (ipAddress.substr(0, 7) == "::ffff:") {
			ipAddress = ipAddress.substr(7);
		}
	}else{
		ipAddress = "162.243.3.149";
	}
	//console.log("Device ip is " + ipAddress);
	return ipAddress;
}

async function sendGetRequest(url) {
	let response = await fetch(url);
	let json = await response.json();

	return json;
}

module.exports = {
	getIpAddress,
	sendGetRequest
};