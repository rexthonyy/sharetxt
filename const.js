let appName = "ShareTXT";
let appEmail = "";
let appEmailPass= "";
let sendEmailUrl = "https://email-dispatcher-api.herokuapp.com/api/v1";

let googleClientId = "";
let googleClientSecret = "";
//let googleCallbackUrl = "http://localhost:3000/auth/google/callback";
let googleCallbackUrl = "https://rexshare.herokuapp.com/auth/google/callback";


let facebookAppID = "";
let facebookAppSecret = "";
//let facebookCallbackUrl = "http://localhost:3000/auth/facebook/callback";
let facebookCallbackUrl = "https://rexshare.herokuapp.com/auth/facebook/callback";


let twitterConsumerKey = "";
let twitterConsumerSecret = "";
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
