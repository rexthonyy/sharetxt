const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.Server(app);

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));

const wss = new WebSocket.Server({ server });

let clients = [];

wss.on('connection', (ws) => {

	clients.push(ws);
	
	console.log(clients.length + " Clients connected");
	
	ws.on('message', (msg) => {
		clients.forEach(client => {
			if(client != ws && client.readyState === WebSocket.OPEN){//send a message to all other clients but yourself
				client.send(msg);
			}
		});
	});

	ws.on('close', () => {
		for(let i = 0; i < clients.length; i++){
			if(clients[i] == ws){
				clients.splice(i);
				break;
			}
		}
		console.log("Client left");
		console.log(clients.length + " clients remaining");
	});
});