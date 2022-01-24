const niceware = require('niceware');
const sgClient = require('@sendgrid/client');
const sgMail = require('@sendgrid/mail');
var flatten = require('flat')

sgClient.setApiKey(process.env.SENDGRID_API_KEY);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

Parse.Cloud.define('hello', req => {
  //req.log.info(req);
  console.log("why are here?")
  return 'Just to suffer';
});

Parse.Cloud.define('asyncFunction', async req => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  req.log.info(req);
  return 'Hi async';
});

Parse.Cloud.beforeSave('Test', () => {
  throw new Parse.Error(9001, 'Saving test objects is not available.');
});

Parse.Cloud.define("googleSignIn", async (request) => {
  const google = require("googleapis").google;
  // Google's OAuth2 client
  const OAuth2 = google.auth.OAuth2;

  // Create an OAuth2 client object from the credentials in our config file
  const oauth2Client = new OAuth2(
    process.env.client_id,
    process.env.client_secret,
    process.env.redirect_uris
  );
  // Obtain the google login link to which we'll send our users to give us access
  const loginLink = oauth2Client.generateAuthUrl({
    // Indicates that we need to be able to access data continously without the user constantly giving us consent
    access_type: "offline",
    // Using the access scopes from our config file
    scope: ["email", "openid", "profile"],
  });
  return loginLink;
});

Parse.Cloud.define("googleToken", async (request) => {
  const google = require("googleapis").google;

  // Google's OAuth2 client
  const OAuth2 = google.auth.OAuth2;

  // Create an OAuth2 client object from the credentials in our config file
  const oauth2Client = new OAuth2(
    process.env.client_id,
    process.env.client_secret,
    process.env.redirect_uris
  );

  if (request.error) {
    // The user did not give us permission.
    return request.error;
  } else {
    try {
      const { tokens } = await oauth2Client.getToken(request.params.code);
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
        name: usr_info.data.name,
        id_token: tokens.id_token,
        access_token: tokens.access_token,
      };
      return authData;
    } catch (error) {
      return error;
    }
  }
});

var getGoogleToken = async (code) => {
  const google = require("googleapis").google;

  // Google's OAuth2 client
  const OAuth2 = google.auth.OAuth2;

  // Create an OAuth2 client object from the credentials in our config file
  const oauth2Client = new OAuth2(
    process.env.client_id,
    process.env.client_secret,
    process.env.redirect_uris
  );

  if (request.error) {
    // The user did not give us permission.
    return request.error;
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
        name: usr_info.data.name,
        id_token: tokens.id_token,
        access_token: tokens.access_token,
      };
      return authData;
    } catch (error) {
      return error;
    }
  }
} 

Parse.Cloud.define("signin-google", async (request) => {
  var result = await getGoogleToken(request.params.code);

  return "cuebandapp://?access_token="+result.access_token;
});

Parse.Cloud.define("generateToken", async (request) => {
  let tokenString  = null;

  //Check if the token already exists
  let tokenExists = true;
  while(tokenExists) {
    const passphraseList = niceware.generatePassphrase(8);
    tokenString = passphraseList.join('-')
    const query = new Parse.Query("Token");
    query.equalTo("token", tokenString);
    const results = await query.find();
    tokenExists = results.length != 0
  }

  const Token = Parse.Object.extend("Token");
  const tokenObject = new Token();
  tokenObject.set("token", tokenString);
  
  const numberOfDaysUntilExpire = 7
  const expireDate = new Date(); 
  expireDate.setDate(expireDate.getDate() + numberOfDaysUntilExpire);
  console.log(expireDate);
  tokenObject.set("expireDate", expireDate);
  console.log(tokenObject);

  let result = await tokenObject.save();
  console.log(result);

  return tokenString;
});


Parse.Cloud.define("tokenInfo", async (request) => {

  const tokenString = request.params.token;
  const query = new Parse.Query("Token");
  query.equalTo("token", tokenString);
  const results = await query.find();
  if(results.length == 0)
  {
    console.log("Error - Token not in database!");
    return {
      "code": 141,
      "error": "Invalid Token"
    };
  }

  var expireDate = results[0].get("expireDate");

  //Get Sendgrid Contact Lists
  const requestList = {
    method: 'GET',
    url: '/v3/marketing/lists'
  };
  let [response, body] = await sgClient.request(requestList)

  if(response.statusCode != 200) {
    console.log('Error getting lists!');
    return {
      "code": 141,
      "error": "Invalid Token"
    };
  }

  const consentList = body.result.find(element => element.name ===  process.env.CONTACT_LIST_NAME); 
  if(consentList == undefined || consentList == null) {
    console.log('List not found!');
    return {
      "code": 141,
      "error": "Invalid Token"
    };
  }

  //Search for token
  const tokenQuery = {
    query: `consent_get_involved_study_token LIKE '${tokenString}' AND CONTAINS(list_ids, '${consentList.id}')`
  }

  const tokenQueryRequest = {
    method: 'POST',
    url: '/v3/marketing/contacts/search',
    body: tokenQuery
  };
  let [queryResponse, queryBody] = await sgClient.request(tokenQueryRequest);

  if(queryResponse.statusCode != 200 || queryBody.contact_count == 0) {
    console.log("Error - Token not found in Sendgrid");
    return {
      "code": 141,
      "error": "Invalid Token"
    };
  }


  queryBody.result[0]['expireDate'] = expireDate

  console.log(queryBody.result[0]);
  return queryBody.result[0];
},{
  fields : ['token'],
  requireUser: false
});
