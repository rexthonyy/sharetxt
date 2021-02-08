const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.Server(app);

app.use(express.static('public'));

const LOCAL_PORT = 3000;
const PORT = process.env.PORT || LOCAL_PORT;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));

const wss = new WebSocket.Server({ server });

let clients = [];

wss.on('connection', (ws) => {

  clients.push(ws);
  console.log(clients.length + " clients connected");

  ws.on('message', (msg) => {
	  clients.forEach(client => {
		if(client != ws && client.readyState === WebSocket.OPEN){
			client.send(msg);
		}
	  });
  });

  ws.on('close', () => {
	  for(let i = 0; i < clients.length; i++){
		  if(clients[i] == ws){
			  clients.splice(i);
		  }
	  }
	  
	  console.log(clients.length + " clients remaining");
  });
});