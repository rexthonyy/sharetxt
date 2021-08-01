let appName = "ShareTXT";
let appEmail = "sharetxtapp@gmail.com";
let appEmailPass= "sharetxt123app";
let sendEmailUrl = "https://email-dispatcher-api.herokuapp.com/api/v1";

let googleClientId = "1009354150419-l0a4m06hh54kkspnek8drle703o9mfa6.apps.googleusercontent.com";
let googleClientSecret = "MRwKPkokVcQctA3pBa7EN1w5";
//let googleCallbackUrl = "http://localhost:3000/auth/google/callback";
let googleCallbackUrl = "https://rexshare.herokuapp.com/auth/google/callback";


let facebookAppID = "184211980360651";
let facebookAppSecret = "5586c3d3fad28813ea82cef4db7c13e6";
//let facebookCallbackUrl = "http://localhost:3000/auth/facebook/callback";
let facebookCallbackUrl = "https://rexshare.herokuapp.com/auth/facebook/callback";


let twitterConsumerKey = "lddigO2q5m5l2LDQwSBQWUrEe";
let twitterConsumerSecret = "0nLSF50tDYArCu8YSlcxhpkh7lSNhosue09b4MNNVZz7viHtpe";
//let twitterCallbackUrl = "http://localhost:3000/auth/twitter/callback";
let twitterCallbackUrl = "https://rexshare.herokuapp.com/auth/twitter/callback";

module.exports = {
    appName,
    appEmail,
    appEmailPass,
    sendEmailUrl,
    googleClientId,
    googleClientSecret,
    googleCallbackUrl,
    facebookAppID,
    facebookAppSecret,
    facebookCallbackUrl,
    twitterConsumerKey,
    twitterConsumerSecret,
    twitterCallbackUrl
};