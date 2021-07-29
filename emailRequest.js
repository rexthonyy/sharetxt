const util = require('./util');
const consts = require('./const');

function sendMagicLinkEmail(req, email, magicLink, roomName, callback) {

    let name = consts.appName;
    let user = consts.appEmail;
    let pass = consts.appEmailPass;
    let from = consts.appName;
    let to = email;
    let subject = "Confirm your email";
    let html = `
	<table width='100%' border='0'>
        <tr>
            <td style='color:rgb(80, 80, 80); font-family:Verdana; line-height:1.8em; font-size:14px;'>
            
                Hi,
                <br/>
                Click the button below to claim <b>${util.getHostUrl(req)}/${roomName}</b>. 
                The link expires in 30 minutes.
                <br/><br/>
                <a href="${magicLink}">
                    <button style="background-color: rgb(71, 190, 185); padding: 16px 18px; border: 0; color: white; cursor: pointer;">Claim my link</button>
                </a>
                <br/><br/>
                or
                <br/><br/>
                Paste the link below in a browser
                <br/>
                <a href="${magicLink}">${magicLink}</a>
            </td>
        </tr>
	</table>
	`;

    let data = {
        user: user,
        pass: pass,
        from: from + "<" + user + ">",
        to: to,
        subject: subject,
        html: html
    };

    util.sendPostRequest(consts.sendEmailUrl, data)
    .then(json => {
        if (json.status == 'success') {
            callback(true);
        } else {
            console.log(json.message);
            callback(false);
        }
    }).catch(err => {
        console.error(err);
        callback(false);
    });
}

function sendResetCodeEmail(email, code, callback) {

    let name = consts.appName;
    let user = consts.appEmail;
    let pass = consts.appEmailPass;
    let from = consts.appName;
    let to = email;
    let subject = `${code} is your verification code`;
    let html = `
	<table width='100%' border='0'>
        <tr>
            <td style='color:rgb(80, 80, 80); font-family:Verdana; line-height:1.8em; font-size:14px;'>
            
                Hi,
                <br/>
                Your verification code is<br><br> 
                <b>${code}</b>
                <br/><br/>
                Copy and paste the code in shareTXT to change your password. 
                The code expires in 30 minutes.      
            </td>
        </tr>
	</table>
	`;

    let data = {
        user: user,
        pass: pass,
        from: from + "<" + user + ">",
        to: to,
        subject: subject,
        html: html
    };

    util.sendPostRequest(consts.sendEmailUrl, data)
    .then(json => {
        if (json.status == 'success') {
            callback(true);
        } else {
            console.log(json.message);
            callback(false);
        }
    }).catch(err => {
        console.error(err);
        callback(false);
    });
}

module.exports = {
    sendMagicLinkEmail,
    sendResetCodeEmail
};