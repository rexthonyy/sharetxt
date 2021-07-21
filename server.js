const express = require('express');
// const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.Server(app);

app.set('view engine', 'ejs');
app.use(express.static('public'));

const LOCAL_PORT = 3000;
const PORT = process.env.PORT || LOCAL_PORT;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));

const wss = new WebSocket.Server({ server });

app.get('/', (req, res) => {
	res.redirect('/default');
});

app.get('/:room', (req, res) => {
	let roomName = req.params.room;
	//console.log("route is " + roomName);
	res.render('index', { roomName: roomName });
});

let rooms = {};

wss.on('connection', (ws) => {
	
	ws.on('message', (msg) => {
		msg = JSON.parse(msg);
		console.log("message");
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
						//console.log("client joined a room");
					}
				}else{
					rooms[msg.roomName] = [];
					rooms[msg.roomName].push(ws);
					//console.log("client added to empty room");
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
				
				//showStat();
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
				//console.log("Removed client from " + roomName);
				if(clientList.length == 0){
					delete rooms.roomName;
					//console.log(roomName + " deleted");
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
		
		//showStat();
	});
});

function showStat(){
	for(const [roomName, clientList] of Object.entries(rooms)){
		console.log(clientList.length + " Clients in " + roomName);
    }
}