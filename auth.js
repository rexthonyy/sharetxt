const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const TwitterStrategy = require("passport-twitter").Strategy;
const router = express.Router();
const SessionsModel = require('./models/Sessions');
const UsersModel = require('./models/Users');
const AuthModel = require('./models/Auth');
const VerifyModel = require('./models/Verify');
const SocialAuthModel = require('./models/SocialAuth');
const { v4: uuidv4 } = require('uuid');
const api = require('./api');
const util = require('./util');
const consts = require('./const');
const emailRequest = require('./emailRequest');






// EMAIL

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












async function preauthenticate(req, res, next){
    let type = req.query.type;
    if(type == "signup"){
        let roomName = req.query.roomName;
        api.isRoomNameRegistered(roomName, async response => {
            if(response.status == "success"){
                if(!response.isRegistered){
                    // get social session id
                    let socialSessionId = uuidv4().split("-").join("");
                    let minutes = 1000 * 60 * 30; // 30 minutes for session to expire
                    let expire = Date.now() + minutes;

                    const socialAuthToSave = new SocialAuthModel({
                        type: "signup",
                        socialSessionId: socialSessionId,
                        roomName: roomName,
                        expire: expire
                    });

                    try{
                        await socialAuthToSave.save();
                        req.session.socialSessionId = socialSessionId;
                        res.cookie('socialSessionId', socialSessionId, { maxAge: minutes, httpOnly: true });

                        next();
                    }catch(e){
                        res.send("Internal error. Please try again");
                    }
                }else{
                    res.send("Name is already registered. Sign in");
                }
            }else{
                res.send("Name could not be verified");
            }
        });
    }else{
        // get social session id
        let socialSessionId = uuidv4().split("-").join("");
        let minutes = 1000 * 60 * 30; // 30 minutes for session to expire
        let expire = Date.now() + minutes;

        const socialAuthToSave = new SocialAuthModel({
            type: "login",
            socialSessionId: socialSessionId,
            expire: expire
        });

        try{
            await socialAuthToSave.save();
            req.session.socialSessionId = socialSessionId;
            res.cookie('socialSessionId', socialSessionId, { maxAge: minutes, httpOnly: true });

            next();
        }catch(e){
            res.send("Internal error. Please try again");
        }
    }
}





// GOOGLE
passport.use(new GoogleStrategy({
    clientID: consts.googleClientId,
    clientSecret: consts.googleClientSecret,
    callbackURL: consts.googleCallbackUrl,
    passReqToCallback: true
},
function(req, accessToken, refreshToken, profile, done) {
    req.session.socialAuthProfile = profile;
    return done(null, profile);
}));

router.get('/google', preauthenticate, passport.authenticate('google', { scope: ['profile', 'email']}));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/'}), function (req, res) {
    let profile = req.session.socialAuthProfile;
    delete req.session.socialAuthProfile;

    let googleId = profile.id;
    let googleEmail = profile.email;

    if(util.getSocialAuth(req, socialAuth => {
        if(socialAuth != null){
            //table entry will be delete when it expires by the cron job
            res.clearCookie("socialSessionId");
            delete req.session.socialSessionId;

            if(socialAuth.type == "signup"){
                return signupGoogleUser(req, res, { id: googleId, email: googleEmail }, socialAuth.roomName);
            }else{
               return loginGoogleUser(req, res, googleId);
            }
        }

        res.redirect('/');
    }));
});

function signupGoogleUser(req, res, user, roomName){
    api.isGoogleIdRegistered(user.id, result => {
        if(result.status == "success"){
            if(!result.isRegistered){
                api.isRoomNameRegistered(roomName, async result => {
                    if(result.status == "success"){
                        if(!result.isRegistered){
                            let authType = "google";
                            let userId = user.id;
                            let email = user.email;
                            let sessionId = uuidv4().split("-").join("");;
                            let days = 1000 * 60 * 60 * 24 * 7 * 4; // 1 month for session to expire
                            let expire = Date.now() + days;

                            const newUserToSave = new UsersModel({
                                authType: authType,
                                userId: userId,
                                email: email,
                                roomName: roomName
                            });

                            try{
                                await newUserToSave.save();

                                const session = new SessionsModel({
                                    userId: userId,
                                    sessionId: sessionId,
                                    expire: expire
                                });
                                await session.save();
                                req.session.user.sessionId = sessionId;
                                res.cookie('sharetxtSessionId', sessionId, { maxAge: days, httpOnly: true });
                            }catch(e){
                                console.log(e);
                            }
                        }
                    }else{
                        res.redirect('/');
                    }
                });
            }else{
                return loginGoogleUser(req, res, user.id);
            }
        }else{
            res.redirect('/');
        }
    });
}

function loginGoogleUser(req, res, userId){
    api.isGoogleIdRegistered(userId, async cb => {
        if(cb.status == "success"){
            if(cb.isRegistered){
                let sessionId = uuidv4().split("-").join("");
                let days = 1000 * 60 * 60 * 24 * 7 * 4; //1 month for session to expire
                let expire = Date.now() + days;

                const newSession = new SessionsModel({
                    userId: userId,
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
            }
        }
        
        res.redirect("/");
    });
}






// FACEBOOK

passport.use(new FacebookStrategy({
    clientID: consts.facebookAppID,
    clientSecret: consts.facebookAppSecret,
    callbackURL: consts.facebookCallbackUrl,
    passReqToCallback: true
},
function(req, accessToken, refreshToken, profile, done) {
    console.log(profile);
    // req.session.socialAuthProfile = profile;
    return done(null, profile);
}));

router.get('/facebook', passport.authenticate('facebook', { scope: ['public_profile', 'email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', { successRedirect: '/auth/facebook/success', failureRedirect: '/' }));

router.get('/facebook/success', (req, res) => {

    return res.redirect('/');
    let profile = req.session.socialAuthProfile;
    delete req.session.socialAuthProfile;

    let facebookId = profile.id;

    if(util.getSocialAuth(req, socialAuth => {
        if(socialAuth != null){
            //table entry will be delete when it expires by the cron job
            res.clearCookie("socialSessionId");
            delete req.session.socialSessionId;

            if(socialAuth.type == "signup"){
                return signupFacebookUser(req, res, { id: facebookId }, socialAuth.roomName);
            }else{
               return loginFacebookUser(req, res, facebookId);
            }
        }

        res.redirect('/');
    }));
});

function signupFacebookUser(req, res, user, roomName){
    api.isFacebookIdRegistered(user.id, result => {
        if(result.status == "success"){
            if(!result.isRegistered){
                api.isRoomNameRegistered(roomName, async result => {
                    if(result.status == "success"){
                        if(!result.isRegistered){
                            let authType = "facebook";
                            let userId = user.id;
                            let sessionId = uuidv4().split("-").join("");;
                            let days = 1000 * 60 * 60 * 24 * 7 * 4; // 1 month for session to expire
                            let expire = Date.now() + days;

                            const newUserToSave = new UsersModel({
                                authType: authType,
                                userId: userId,
                                roomName: roomName
                            });

                            try{
                                await newUserToSave.save();

                                const session = new SessionsModel({
                                    userId: userId,
                                    sessionId: sessionId,
                                    expire: expire
                                });
                                await session.save();
                                req.session.user.sessionId = sessionId;
                                res.cookie('sharetxtSessionId', sessionId, { maxAge: days, httpOnly: true });
                            }catch(e){
                                console.log(e);
                            }
                        }
                    }
                    
                    res.redirect('/');
                });
            }else{
                return loginFacebookUser(req, res, user.id);
            }
        }else{
            res.redirect('/');
        }
    });
}

function loginFacebookUser(req, res, userId){
    api.isGoogleIdRegistered(userId, async cb => {
        if(cb.status == "success"){
            if(cb.isRegistered){
                let sessionId = uuidv4().split("-").join("");
                let days = 1000 * 60 * 60 * 24 * 7 * 4; //1 month for session to expire
                let expire = Date.now() + days;

                const newSession = new SessionsModel({
                    userId: userId,
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
            }
        }
        
        res.redirect("/");
    });
}









// TWITTER

passport.use(new TwitterStrategy({
    consumerKey: consts.twitterConsumerKey,
    consumerSecret: consts.twitterConsumerSecret,
    callbackURL: consts.twitterCallbackUrl,
    passReqToCallback: true
},
function(req, accessToken, refreshToken, profile, done) {
    req.session.socialAuthProfile = profile;
    return done(null, profile);
}));

router.get('/twitter', preauthenticate, passport.authenticate('twitter'));
router.get('/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/' }), (req, res) => {
    let profile = req.session.socialAuthProfile;
    delete req.session.socialAuthProfile;

    console.log(profile);
    /*
    let googleId = profile.id;
    let googleEmail = profile.email;

    if(util.getSocialAuth(req, socialAuth => {
        if(socialAuth != null){
            //table entry will be delete when it expires by the cron job
            res.clearCookie("socialSessionId");
            delete req.session.socialSessionId;

            if(socialAuth.type == "signup"){
                return signupGoogleUser(req, res, { id: googleId, email: googleEmail }, socialAuth.roomName);
            }else{
               return loginGoogleUser(req, res, googleId);
            }
        }

        res.redirect('/');
    }));*/
});

function signupTwitterUser(req, res, user, roomName){
    api.isGoogleIdRegistered(user.id, result => {
        if(result.status == "success"){
            if(!result.isRegistered){
                api.isRoomNameRegistered(roomName, async result => {
                    if(result.status == "success"){
                        if(!result.isRegistered){
                            let authType = "google";
                            let userId = user.id;
                            let email = user.email;
                            let sessionId = uuidv4().split("-").join("");;
                            let days = 1000 * 60 * 60 * 24 * 7 * 4; // 1 month for session to expire
                            let expire = Date.now() + days;

                            const newUserToSave = new UsersModel({
                                authType: authType,
                                userId: userId,
                                email: email,
                                roomName: roomName
                            });

                            try{
                                await newUserToSave.save();

                                const session = new SessionsModel({
                                    userId: userId,
                                    sessionId: sessionId,
                                    expire: expire
                                });
                                await session.save();
                                req.session.user.sessionId = sessionId;
                                res.cookie('sharetxtSessionId', sessionId, { maxAge: days, httpOnly: true });
                            }catch(e){
                                console.log(e);
                            }
                        }
                    }else{
                        res.redirect('/');
                    }
                });
            }else{
                return loginGoogleUser(req, res, user.id);
            }
        }else{
            res.redirect('/');
        }
    });
}

function loginTwitterUser(req, res, userId){
    api.isGoogleIdRegistered(userId, async cb => {
        if(cb.status == "success"){
            if(cb.isRegistered){
                let sessionId = uuidv4().split("-").join("");
                let days = 1000 * 60 * 60 * 24 * 7 * 4; //1 month for session to expire
                let expire = Date.now() + days;

                const newSession = new SessionsModel({
                    userId: userId,
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
            }
        }
        
        res.redirect("/");
    });
}



module.exports = router;