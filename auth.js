const express = require("express");
const router = express.Router();
const SessionsModel = require('./models/Sessions');
const UsersModel = require('./models/Users');
const AuthModel = require('./models/Auth');
const VerifyModel = require('./models/Verify');
const { v4: uuidv4 } = require('uuid');
const api = require('./api');
const util = require('./util');
const emailRequest = require('./emailRequest');

router.post('/email/signup', api.checkIpAddress, (req, res) => {
    let email = req.body.email;
    let roomName = req.body.roomName;
    let password = req.body.password;

    api.isEmailRegistered(email, response => {
        if(response.status == "success"){
            if(response.isRegistered){
                res.json({ status: "failed", message: "Email is already registered" });
            }else{
                api.isRoomNameRegistered(roomName, response => {
                    if(response.status == "success"){
                        if(response.isRegistered){
                            res.json({ status: "failed", message: `"${roomName}" is already acquired` });
                        }else{
                            if(password.length < 6){
                                res.json({ status: "failed", message: "Password must be 6 or more characters" });
                            }else{
                                let authId = uuidv4().split("-").join("");
                                let magicLink = util.getHostUrl(req) + "/auth/email/signup/callback/" + authId;

                                emailRequest.sendMagicLinkEmail(req, email, magicLink, roomName, async isSent => {
                                    if (isSent) {
                                        
                                        let expire = Date.now() + (1000 * 60 * 30);    //expire in 30 minutes
                                        let authToSave = new AuthModel({
                                            authId: authId,
                                            email: email,
                                            password: password,
                                            roomName: roomName,
                                            expire: expire
                                        });
                                        
                                        try{
                                            await authToSave.save();
                                            res.json({ status: "success" });
                                        }catch(e){
                                            res.json({ status: "error", message: e });
                                        }
                                    }else{
                                        res.json({ status: "error", message: `Failed to send email to ${email}. Please check your internet connection.` });
                                    }
                                });
                            }
                        }
                    }else{
                        res.json({ status: "error" });
                    }
                });
            }
        }else{
            res.json({ status: "error" });
        }
    });
});

router.get('/email/signup/callback/:authId', (req, res) => {
    let authId = req.params.authId;

    AuthModel.findOne({ authId: authId }, async (err, doc) => {
        if(err || doc == null){
            res.redirect("/default");
        }else{
            let userId = uuidv4().split("-").join("");
            let email = doc.email;
            let password = doc.password;
            let roomName = doc.roomName;
            let sessionId = authId;
            let days = 1000 * 60 * 60 * 24 * 7 * 4; // 1 month for session to expire
            let expire = Date.now() + days;    

            //create new user
            let newUser = new UsersModel({
                authType: "email",
                userId: userId,
                email: email,
                password: password,
                roomName: roomName
            });

            try{
                await newUser.save();

                const session = new SessionsModel({
                    userId: userId,
                    sessionId: sessionId,
                    expire: expire
                });
                await session.save();
                req.session.user.sessionId = sessionId;
                res.cookie('sharetxtSessionId', sessionId, { maxAge: days, httpOnly: true });

                // delete auth entry
                doc.remove();

                res.redirect(`/${roomName}`);
            }catch(e){
                res.redirect("/default");
            }
        }
    });
});

router.post('/email/login', api.checkIpAddress, (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    api.isEmailRegistered(email, response => {
        if(response.status == "success"){
            if(!response.isRegistered){
                res.json({ status: "failed", message: "Email is not yet registered" });
            }else{
                if(password.length < 6){
                    res.json({ status: "failed", message: "Password must be 6 or more characters" });
                }else{
                    UsersModel.findOne({ authType: "email", email: email, password: password }, async (err, doc) => {
                        if(err || doc == null) return res.json({ status: "failed", message: "login details incorrect" });

                        let sessionId = uuidv4().split("-").join("");
                        let days = 1000 * 60 * 60 * 24 * 7 * 4; //1 month for session to expire
                        let expire = Date.now() + days;

                        const newSession = new SessionsModel({
                            userId: doc.userId,
                            sessionId: sessionId,
                            expire: expire
                        });

                        try{
                            await newSession.save();
                        }catch(e){
                            console.log(e);
                        }

                        req.session.user.sessionId = sessionId;
                        res.cookie('sharetxtSessionId', sessionId, { maxAge: days, httpOnly: true });

                        res.json({ status: "success", roomName: doc.roomName });
                    });
                }
            }
        }else{
            res.json({ status: "error" });
        }
    });
});

router.post('/email/forgottenPassword', api.checkIpAddress, (req, res) => {
    let email = req.body.email;

    api.isEmailRegistered(email, response => {
        if(response.status == "success"){
            if(!response.isRegistered){
                res.json({ status: "failed", message: "Email is not yet registered" });
            }else{
                let code = Math.floor(util.getRandom(100000, 999999));
                emailRequest.sendResetCodeEmail(email, code, isSent => {
                    if (isSent) {
                        VerifyModel.find({ email: email }, async (err, doc) => {
                            if(doc != null){
                                doc.forEach(verify => {
                                    verify.remove();
                                });
                                
                                let expire = Date.now() + (1000 * 60 * 60 * 30); //30 minutes
                                const verifyToSave = new VerifyModel({
                                    email: email,
                                    code: code,
                                    expire: expire
                                });
        
                                try{
                                    await verifyToSave.save();
                                    res.json({ status: "success" });
                                }catch(e){
                                    res.json({ status: "error", message: e });
                                }
                            }
                        });
                    }else{
                        res.json({ status: "error", message: "Failed to send reset code. Please check your internet connection." });
                    }
                });
            }
        }else{
            res.json({ status: "error" });
        }
    });
});

router.post('/email/confirmEmail', api.checkIpAddress, (req, res) => {
    let email = req.body.email;
    let code = req.body.code;

    api.isEmailRegistered(email, response => {
        if(response.status == "success"){
            if(!response.isRegistered){
                res.json({ status: "failed", message: "Email is not yet registered" });
            }else{
                VerifyModel.findOne({ email: email, code: code }, (err, doc) => {
                    if(err || doc == null) return res.json({ status: "failed", message: "Verification failed" });

                    res.json({ status: "success" });
                });
            }
        }else{
            res.json({ status: "error" });
        }
    });
});

router.post('/email/changePassword', api.checkIpAddress, (req, res) => {
    let password = req.body.password;
    let email = req.body.email;
    let code = req.body.code;

    api.isEmailRegistered(email, response => {
        if(response.status == "success"){
            if(!response.isRegistered){
                res.json({ status: "failed", message: "Email is not yet registered" });
            }else{
                VerifyModel.findOne({ email: email, code: code }, (err, doc) => {
                    if(err || doc == null) return res.json({ status: "failed", message: "Verification failed" });
                    doc.remove();
                    UsersModel.findOne({ authType: "email", email: email }, async (err, doc) => {
                        if(err || doc == null) return res.json({ status: "failed", message: "Email not yet registered" });
                        doc.password = password;
                        try{
                            await doc.save();
                            res.json({ status: "success" });
                        }catch(e){
                            console.error(e);
                            res.json({ status: "error" });
                        }
                    });
                });
            }
        }else{
            res.json({ status: "error" });
        }
    });
});

module.exports = router;