const express = require("express");
const router = express.Router();
const UsersModel = require('./models/Users');
const util = require('./util');

function checkIpAddress(req, res, next){
    next();
}

function isGoogleIdRegistered(googleId, cb){
    UsersModel.findOne({ authType: "google", userId: googleId }, (err, doc) => {
        if(err) return cb({ status: "failed" });
		if(doc == null) return cb({ status: "success", isRegistered: false }); 
        cb({ status: "success", isRegistered: true });
    });
}
function isFacebookIdRegistered(facebookId, cb){
    UsersModel.findOne({ authType: "facebook", userId: facebookId }, (err, doc) => {
        if(err) return cb({ status: "failed" });
		if(doc == null) return cb({ status: "success", isRegistered: false }); 
        cb({ status: "success", isRegistered: true });
    });
}
function isTwitterIdRegistered(twitterId, cb){
    UsersModel.findOne({ authType: "twitter", userId: twitterId }, (err, doc) => {
        if(err) return cb({ status: "failed" });
		if(doc == null) return cb({ status: "success", isRegistered: false }); 
        cb({ status: "success", isRegistered: true });
    });
}

function isEmailRegistered(email, cb){
    if(!util.isEmailValid(email)){
        cb({ status: "failed", message: "Email format is not supported" });
    }else{
        UsersModel.findOne({ authType: "email", email: email }, (err, doc) => {
            if(err){
                cb({ status: "failed", message: err });
            }else if(doc == null){
                cb({ status: "success", isRegistered: false });
            }else{
                cb({ status: "success", isRegistered: true });
            }
        });
    }
}

function isRoomNameRegistered(roomName, cb){
    if(roomName.length == 0){
        cb({ status: "failed", message: "Please enter a name" });
    }else if(['api', 'auth', 'app', 'blog', 'cron', 'default', 'general', 'home'].find(route => route == roomName)){
        cb({ status: "success", isRegistered: true });
    }else{
        UsersModel.findOne({ roomName: roomName }, (err, doc) => {
            if(err){
                cb({ status: "failed", message: err });
            }else if(doc == null){
                cb({ status: "success", isRegistered: false });
            }else{
                cb({ status: "success", isRegistered: true });
            }
        });
    }
}

router.get('/checkEmail', checkIpAddress, (req, res) => {
    let email = req.query.email;
    isEmailRegistered(email, response => {
        res.json(response);
    });
});

router.get('/checkRoomName', checkIpAddress, (req, res) => {
    let roomName = req.query.roomName;
    isRoomNameRegistered(roomName, response => {
        res.json(response);
    });
});

module.exports = {
    router,
    checkIpAddress,
    isEmailRegistered,
    isRoomNameRegistered,
    isGoogleIdRegistered,
    isFacebookIdRegistered,
    isTwitterIdRegistered
};