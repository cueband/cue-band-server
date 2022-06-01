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
  tokenObject.set("expireDate", expireDate);

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

Parse.Cloud.define("submitAssessment", async (request) => {
  console.log("submitAssessment");
  console.log(request);

  console.log("token", request.params.token);
  console.log("assessmentNumber", request.params.assessmentNumber)
  console.log("data", request.params.data)

  const Assessment = Parse.Object.extend("Assessment");
  const assessmentObject = new Assessment();
  assessmentObject.set("token", request.params.token);
  assessmentObject.set("assessmentNumber", Number(request.params.assessmentNumber));
  assessmentObject.set("romps1", Number(request.params.data.romps1));
  assessmentObject.set("romps2", Number(request.params.data.romps2));
  assessmentObject.set("romps3", Number(request.params.data.romps3));
  assessmentObject.set("romps4", Number(request.params.data.romps4));
  assessmentObject.set("romps5", Number(request.params.data.romps5));
  assessmentObject.set("romps6", Number(request.params.data.romps6));
  assessmentObject.set("romps7", Number(request.params.data.romps7));
  assessmentObject.set("romps8", Number(request.params.data.romps8));
  assessmentObject.set("romps9", Number(request.params.data.romps9));
  assessmentObject.set("updrs22", Number(request.params.data.updrs22));
  assessmentObject.set("nmsqDepressionfrequency", request.params.data.nmsqdepressionfrequency);
  assessmentObject.set("nmsqDepressionseverity", request.params.data.nmsqdepressionseverity);
  assessmentObject.set("nmsqAnxietyfrequency", request.params.data.nmsqanxietyfrequency);
  assessmentObject.set("nmsqAnxietyseverity", request.params.data.nmsqanxietyfrequency);
  assessmentObject.set("nmsqApathyfrequency", request.params.data.nmsqanxietyseverity);
  assessmentObject.set("nmsqApathyseverity", request.params.data.nmsqapathyseverity);
  assessmentObject.set("nmsqPsychosisfrequency", request.params.data.nmsqpsychosisfrequency);
  assessmentObject.set("nmsqPsychosisseverity", request.params.data.nmsqpsychosisseverity);
  assessmentObject.set("nmsqImpulsecontrolandrelateddisordersfrequency", request.params.data.nmsqimpulsecontrolandrelateddisordersfrequency);
  assessmentObject.set("nmsqImpulsecontrolandrelateddisordersseverity", request.params.data.nmsqimpulsecontrolandrelateddisordersseverity);
  assessmentObject.set("nmsqCognitionfrequency", request.params.data.nmsqcognitionfrequency);
  assessmentObject.set("nmsqCognitionseverity", request.params.data.nmsqcognitionseverity);
  assessmentObject.set("nmsqOrthostatichypotensionfrequency", request.params.data.nmsqorthostatichypotensionfrequency);
  assessmentObject.set("nmsqOrthostatichypotensionseverity", request.params.data.nmsqorthostatichypotensionseverity);
  assessmentObject.set("nmsqUrinaryfrequency", request.params.data.nmsqurinaryfrequency);
  assessmentObject.set("nmsqUrinaryseverity", request.params.data.nmsqurinaryseverity);
  assessmentObject.set("nmsqSexualfrequency", request.params.data.nmsqsexualfrequency);
  assessmentObject.set("nmsqSexualseverity", request.params.data.nmsqsexualseverity);
  assessmentObject.set("nmsqGastrointestinalfrequency", request.params.data.nmsqgastrointestinalfrequency);
  assessmentObject.set("nmsqGastrointestinalseverity", request.params.data.nmsqgastrointestinalseverity);
  assessmentObject.set("nmsqSleepandwakefulnessfrequency", request.params.data.nmsqsleepandwakefulnessfrequency);
  assessmentObject.set("nmsqSleepandwakefulnessseverity", request.params.data.nmsqsleepandwakefulnessseverity);
  assessmentObject.set("nmsqPainfrequency", request.params.data.nmsqpainfrequency);
  assessmentObject.set("nmsqPainseverity", request.params.data.nmsqpainseverity);
  assessmentObject.set("nmsqOtherfrequency1", request.params.data.nmsqotherfrequency1);
  assessmentObject.set("nmsqOtherfrequency2", request.params.data.nmsqotherfrequency2);
  assessmentObject.set("nmsqOtherseverity", request.params.data.nmsqotherseverity);
  assessmentObject.set("pdq8", request.params.data.pdq8);

  console.log(assessmentObject);

  let result = await assessmentObject.save();
  return result;
});

Parse.Cloud.define("checkAssessmentToken", async (request) => {

  const assessmentNumber = request.params.assessmentNumber;
  if(assessmentNumber == null) {
    console.log("Error - Assessment Number missing");
    return {
      "code": 141,
      "error": " Assessment Number missing"
    };
  }

  const token = request.params.token;
  if(token == null) {
    console.log("Error - Assessment Token missing");
    return {
      "code": 141,
      "error": " Assessment Token missing"
    };
  }

  const query = new Parse.Query("StudyData");
  query.equalTo(`assessment${assessmentNumber}Key`, token);
  const results = await query.find({useMasterKey:true});
  if(results.length == 0)
  {
    console.log("Error - Invalid Token");
    return {
      "code": 141,
      "error": "Invalid Token"
    };
  }

  return "found";
});

Parse.Cloud.define("submitConsentAndDemographics", async (request) => {
  console.log("submitConsentAndDemographics");

  console.log("token", request.params.token);
  console.log("data", request.params.data);

  const Consent = Parse.Object.extend("Consent");
  const consentObject = new Consent();
  consentObject.set("token", request.params.token);
  consentObject.set("question1Answer", request.params.data.c1);
  consentObject.set("question2Answer", request.params.data.c2);
  consentObject.set("question3Answer", request.params.data.c3);
  consentObject.set("question4Answer", request.params.data.c4);
  consentObject.set("question5Answer", request.params.data.c5);
  consentObject.set("question6Answer", request.params.data.c6);
  consentObject.set("question7Answer", request.params.data.c7);
  consentObject.set("question8Answer", request.params.data.c8);
  consentObject.set("question9Answer", request.params.data.c9);
  consentObject.set("name", request.params.data.c10);

  const consentObjectACL = new Parse.ACL();
  consentObjectACL .setPublicReadAccess(false);
  consentObject.setACL(consentObjectACL);

  let resultConsentObjectSave = await consentObject.save();
  if(resultConsentObjectSave.code != null)
    return resultConsentObjectSave;

  const DemographicsData = Parse.Object.extend("DemographicsData");
  const demographicsDataObject = new DemographicsData();
  demographicsDataObject.set("token", request.params.token);
  demographicsDataObject.set("ageRange", request.params.data.f1);
  demographicsDataObject.set("liveOnUk", request.params.data.f2);
  demographicsDataObject.set("ethnicity", request.params.data.f3);

  if(request.params.data.f3 == "White") {
    demographicsDataObject.set("ethnicGroup", request.params.data["white-ethnic-groups"]["white-ethnic-groups"]);
  } else if (request.params.data.f3 == "Mixed or Multiple ethnic groups") {
    demographicsDataObject.set("ethnicGroup", request.params.data["mixed-ethnic-groups"]["mixed-ethnic-groups"]);
  } else if (request.params.data.f3 == "Asian or Asian British") {
    demographicsDataObject.set("ethnicGroup", request.params.data["asian-ethnic-groups"]["asian-ethnic-groups"]);
  } else if (request.params.data.f3 == "Black, African, Caribbean or Black British") {
    demographicsDataObject.set("ethnicGroup", request.params.data["black-ethnic-groups"]["black-ethnic-groups"]);
  } else if (request.params.data.f3 == "Other ethnic group") {
    demographicsDataObject.set("ethnicGroup", request.params.data["other-ethnic-groups"]["other-ethnic-groups"]);
  } else if (request.params.data.f3 == "Prefer not to say") {
    demographicsDataObject.set("ethnicGroup", request.params.data.f3);
  }

  if(request.params.data.f4 == "Not Listed") {
    demographicsDataObject.set("gender", request.params.data["gender-not-listed"]["gender-not-listed"]);
  } else {
    demographicsDataObject.set("gender", request.params.data.f4);
  }

  const demographicsDataACL = new Parse.ACL();
  demographicsDataACL.setPublicReadAccess(false);
  demographicsDataObject.setACL(demographicsDataACL);

  let result = await demographicsDataObject.save();
  return result;
});

Parse.Cloud.define("getPosts", async (request) => {
  const query = new Parse.Query("Post");
  query.equalTo("enabled", true);
  const results = await query.find({useMasterKey:true});
  
  const posts = [];
  results.forEach(element => {
    const post = {
      id: element.id,
      title: element.get("title"),
      content: element.get("content"),
      image: element.get("image"),
      buttonName: element.get("buttonName"),
      url: element.get("url"),
      enabled: element.get("enabled"),
      branch: element.get("branch"),
    }
    posts.push(post);
  });
  return posts;
});

Parse.Cloud.define("sendAppFeedback", async (request) => {

  const AppFeedback = Parse.Object.extend("AppFeedback");
  const appFeedbackObject = new AppFeedback();
  appFeedbackObject.set("text", request.params.text);
  appFeedbackObject.set("recordedTime", request.params.recordedTime);
  appFeedbackObject.set("username", request.params.username);
  appFeedbackObject.set("rating", request.params.rating);
  appFeedbackObject.set("deviceType", request.params.deviceType);

  const appFeedbackObjectACL = new Parse.ACL();
  appFeedbackObjectACL.setPublicReadAccess(false);
  appFeedbackObject.setACL(appFeedbackObjectACL);

  let resultAppFeedbackObjectSave = await appFeedbackObject.save();
  return resultAppFeedbackObjectSave != null;
});

Parse.Cloud.define("getLatestFirmwareRelease", async (request) => {

  const testGroupQuery = new Parse.Query("TestGroup")
  testGroupQuery.equalTo("name", "main");
  const testGroupResult = await testGroupQuery.find({useMasterKey:true});
  console.log("testGroupResult:", testGroupResult);
  if(testGroupResult.length == 0) {
    console.log("testGroupResult: Empty");
    return {};
  }

  var testgroupId = testGroupResult[0].id;
  const testGroupFirmwareReleaseQuery = new Parse.Query("TestGroupFirmwareRelease")
  testGroupFirmwareReleaseQuery.equalTo("testGroupId", testgroupId);
  const testGroupFirmwareReleaseResult = await testGroupFirmwareReleaseQuery.find({useMasterKey:true});
  console.log("testGroupFirmwareReleaseResult:", testGroupFirmwareReleaseResult);
  if(testGroupFirmwareReleaseResult.length == 0) {
    console.log("testGroupFirmwareReleaseResult: Empty");
    return {};
  }

  var latestTestGroupFirmwareRelease = null
  var latestTestGroupFirmwareReleaseOrder = -1; 
  testGroupFirmwareReleaseResult.forEach(element => {
    if(element.get("order") > latestTestGroupFirmwareReleaseOrder) {
      latestTestGroupFirmwareRelease = {
        id: element.id,
        firmwareReleaseId: element.get("firmwareReleaseId"),
        testGroupId: element.get("testGroupId"),
        text: element.get("text"),
        order: element.get("order"),
      }
      latestTestGroupFirmwareReleaseOrder = element.get("order");
    }
  });

  console.log("latestTestGroupFirmwareRelease:", latestTestGroupFirmwareRelease);
  console.log("latestTestGroupFirmwareReleaseId:", latestTestGroupFirmwareRelease.id);

  const firmwareReleaseQuery = new Parse.Query("FirmwareRelease");
  const firmwareReleaseResult = await firmwareReleaseQuery.first({useMasterKey:true});
  console.log("firmwareReleaseResult:", firmwareReleaseResult);
  if(firmwareReleaseResult == undefined) {
    return {};
  }  

  const firmwareRelease = {
    id: firmwareReleaseResult.id,
    downloadLink: firmwareReleaseResult.get("downloadLink"),
    version: firmwareReleaseResult.get("version"),
    minAndroidAppVersion: firmwareReleaseResult.get("minAndroidAppVersion"),
    maxAndroidAppVersion: firmwareReleaseResult.get("maxAndroidAppVersion"),
    minIosAppVersion: firmwareReleaseResult.get("minIosAppVersion"),
    maxIosAppVersion: firmwareReleaseResult.get("maxIosAppVersion"),
    text: latestTestGroupFirmwareRelease["text"],
  }



/*
  const query = new Parse.Query("FirmwareRelease");
  query.equalTo("active", true);
  const results = await query.find({useMasterKey:true});

  console.log(results);

  if(results.length == 0) {
    return {};
  }

  const firmwareRelease = {
    id: results[0].get("id"),
    createdAt: results[0].get("createdAt"),
    downloadLink: results[0].get("downloadLink"),
    version: results[0].get("version"),
    active: results[0].get("active"),
    text: results[0].get("text")
  };*/

  console.log(firmwareRelease);

  return firmwareRelease ;
});