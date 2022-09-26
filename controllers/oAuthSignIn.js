
const getGoogleToken = async (code) => {
    const google = require("googleapis").google;
  
    // Google's OAuth2 client
    const OAuth2 = google.auth.OAuth2;
  
    // Create an OAuth2 client object from the credentials in our config file
    const oauth2Client = new OAuth2(
        process.env.client_id,
        process.env.client_secret,
        process.env.redirect_uris
    );
  
    if (code == null) {
        return null;
    } else {
        try {
            const { tokens } = await oauth2Client.getToken(code);
            oauth2Client.setCredentials(tokens);
            var oauth2 = google.oauth2({
                auth: oauth2Client,
                version: "v2",
            });
            const usr_info = await oauth2.userinfo.get();
            // Auth data for Parse
            const authData = {
                id: usr_info.data.id,
                email: usr_info.data.email,
                id_token: tokens.id_token,
                access_token: tokens.access_token,
            };
            return authData;
        } catch (error) {
            return error;
        }
    }
}

exports.getGoogleToken = async (req, res, next) => {  
    if(req.query.code == undefined)
        return res.sendStatus(404);
    var result = await getGoogleToken(req.query.code);
    res.redirect(`cuebandapp://?id=${result.id}&email=${result.email}&id_token=${result.id_token}&access_token=${result.access_token}`);
}


exports.postAppleToken = async(req, res, next) => {

    console.log(req)

    const html = `<h1>${req.param('state')}</h1>
    <h1>${req.param('code')}</h1>
    <h1>${req.param('id_token')}</h1>
    <h1>${req.param('user')}</h1>`;
    res.send(html);
}
