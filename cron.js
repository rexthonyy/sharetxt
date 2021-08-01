const express = require("express");
const router = express.Router();
const SessionsModel = require("./models/Sessions");
const AuthModel = require("./models/Auth");
const VerifyModel = require("./models/Verify");
const SocialAuthModel = require("./models/SocialAuth");

router.get('/', (req, res) => {
    checkExpiredSession(numSessionsRemoved => {
        checkExpiredAuthentication(numAuthRemoved => {
			checkExpiredVerification(numUnverifiedRemoved => {
				checkExpiredSocialAuth(numSocialAuthRemoved => {
					res.json({ 
						status: "success", 
						sessionsRemoved: numSessionsRemoved, 
						authRemoved: numAuthRemoved, 
						unverifiedRemoved: numUnverifiedRemoved,
						socialAuthRemoved: numSocialAuthRemoved
					});
				});
			});
        });
    });
});

function checkExpiredSession(cb) {
	SessionsModel.find({}, (err, doc) => {
		if (err) return cb(0);
		if (doc == null) return cb(0);
        let numSessionsRemoved = 0;
		doc.forEach(session => {
			if (Date.now() > session.expire) {
				session.remove();
                numSessionsRemoved++;
			}
		});
        cb(numSessionsRemoved);
	});
}

function checkExpiredAuthentication(cb) {
    AuthModel.find({}, (err, doc) => {
        if (err) return cb(0);
		if (doc == null) return cb(0);
        let numRemoved = 0;
		doc.forEach(auth => {
			if (Date.now() > auth.expire) {
				auth.remove();
                numRemoved++;
			}
		});
        cb(numRemoved);
    });
}

function checkExpiredVerification(cb) {
	VerifyModel.find({}, (err, doc) => {
        if (err) return cb(0);
		if (doc == null) return cb(0);
        let numRemoved = 0;
		doc.forEach(verify => {
			if (Date.now() > verify.expire) {
				verify.remove();
                numRemoved++;
			}
		});
        cb(numRemoved);
    });
}

function checkExpiredSocialAuth(cb) {
	SocialAuthModel.find({}, (err, doc) => {
        if (err) return cb(0);
		if (doc == null) return cb(0);
        let numRemoved = 0;
		doc.forEach(auth => {
			if (Date.now() > auth.expire) {
				auth.remove();
                numRemoved++;
			}
		});
        cb(numRemoved);
    });
}


module.exports = router;