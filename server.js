const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const util = require('./util');

const app = express();
const server = http.Server(app);

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.json());

const LOCAL_PORT = 3000;
const PORT = process.env.PORT || LOCAL_PORT;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));

const wss = new WebSocket.Server({ server: server });

app.get('/', (req, res) => {
	res.redirect('/default');
});

app.get('/:room', (req, res) => {
	let roomName = req.params.room;
	getCountryCode(util.getIpAddress(req), response => {
		let lang = response.status == "success" ? getLanguageFromCountryCode(response.countryCode) : "EN";
		res.render('index', { roomName: roomName, lang: lang });
	});
});

function getLanguageFromCountryCode(countryCode){
	console.log("countryCode ==============================================> " + countryCode);
	switch(countryCode){
		case "TW":
		case "CN":
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
		util.sendGetRequest(lookupAgent)
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
				console.error(err);
				callback({ status: 'failed' });
			});
	}
}

let rooms = {};

wss.on('connection', (ws) => {
	
	ws.on('message', (msg) => {
		msg = JSON.parse(msg);
		
		switch(msg.type){
			case 'connection':
				if(rooms[msg.roomName]){
					let isClientInRoom = false;
					rooms[msg.roomName].forEach(client => {
						if(ws == client){
							isClientInRoom = true;
						}
					});

					if(!isClientInRoom){
						rooms[msg.roomName].push(ws);
					}
				}else{
					rooms[msg.roomName] = [];
					rooms[msg.roomName].push(ws);
				}	

				let con_response = {
					type: 'userConnected',
					numUsers: rooms[msg.roomName].length
				};
				
				rooms[msg.roomName].forEach(client => {
					if(client.readyState === WebSocket.OPEN){
						client.send(JSON.stringify(con_response));
					}
				});
			break;
			
			case 'message':
				let msg_response = {
					type: 'msg',
					msg: msg.text
				};
				
				if(rooms[msg.roomName]){
					rooms[msg.roomName].forEach(client => {
						if(ws != client && client.readyState === WebSocket.OPEN){
							client.send(JSON.stringify(msg_response));
						}
					});
				}
			break;
		}
	});

	ws.on('close', () => {
		for(const [roomName, clientList] of Object.entries(rooms)){
			const index = clientList.findIndex(client => ws == client);
			if(index !== -1){
				clientList.splice(index, 1);
				if(clientList.length == 0){
					delete rooms.roomName;
				}else{
					let con_response = {
						type: 'userConnected',
						numUsers: clientList.length
					};
					
					clientList.forEach(client => {
						if(client.readyState === WebSocket.OPEN){
							client.send(JSON.stringify(con_response));
						}
					});
				}
			}
		}
	});
});

function showStat(){
	for(const [roomName, clientList] of Object.entries(rooms)){
		console.log(clientList.length + " Clients in " + roomName);
    }
}