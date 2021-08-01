const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const http = require('http');
const WebSocket = require('ws');
const util = require('./util');
const UsersModel = require('./models/Users');
const SessionsModel = require('./models/Sessions');
const api = require('./api');
const authRouter = require('./auth');
const cronRouter = require('./cron');

const app = express();
const server = http.Server(app);

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());
app.use(session({
	secret: "sharetxtsecret",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(util.setup);
app.use('/api', api.router);
app.use('/auth', authRouter);
app.use('/cron', cronRouter);

const LOCAL_PORT = 3000;
const PORT = process.env.PORT || LOCAL_PORT;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));

const MONGODB_URL = "mongodb://rex:anthony@localhost:27017/sharetxtdb?authSource=admin";
mongoose.connect(process.env.MONGODB_URI || MONGODB_URL, {
	useNewUrlParser: true,
	useCreateIndex: true,
	useUnifiedTopology: true
}).then(res => {
	console.log('Connected to mongodb');
});

passport.serializeUser((user, cb) => {
	cb(null, user);
});

passport.deserializeUser((obj, cb) => {
	cb(null, obj);
});

const wss = new WebSocket.Server({ server: server });

function gotoRoom(req, res, view, roomName){
	util.getLanguage(req, lang => {
		res.render(view, { roomName: roomName, lang: lang });
	});
}

app.get('/', (req, res) => {
	res.redirect('/default');
});

app.get('/:room', loginIfAuthenticated, checkIfRoomIsAcquired, (req, res) => {
	let roomName = req.params.room;
	gotoRoom(req, res, "index", roomName);
});

// app.get('*', (req, res) => {
// 	res.redirect('/default');
// });

function loginIfAuthenticated(req, res, next){
	if (util.isUserLoggedIn(req)) {
		SessionsModel.findOne({ sessionId: req.session.user.sessionId }, (err, doc) => {
			if (err || doc == null) return next();
			UsersModel.findOne({ userId: doc.userId }, (err, doc) => {
				if (err || doc == null) return next();
				let roomName = req.params.room;
				if(roomName == doc.roomName){
					gotoRoom(req, res, "room", doc.roomName);
				}else{
					res.redirect(`/${doc.roomName}`);
				}
			});
		});
	}else{
		next();
	}
}

function checkIfRoomIsAcquired(req, res, next){
	let roomName = req.params.room;
	UsersModel.findOne({ roomName: roomName }, (err, doc) => {
		if (err || doc == null) return next();
		gotoRoom(req, res, "acquired", roomName);
	});
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