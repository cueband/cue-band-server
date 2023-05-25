const niceware = require('niceware');
const sgClient = require('@sendgrid/client');
const sgMail = require('@sendgrid/mail');
var flatten = require('flat')
const crypto = require('crypto');

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


Parse.Cloud.define("appleSignIn", async (request) => {
  const url = new URL("https://appleid.apple.com/auth/authorize");
  url.searchParams.append("client_id", process.env.apple_client_id);
  url.searchParams.append("redirect_uri", process.env.apple_redirect_uri);
  url.searchParams.append("response_type", "code id_token");
  url.searchParams.append("state", crypto.randomBytes(20).toString('hex'));
  url.searchParams.append("scope", "email");
  url.searchParams.append("response_mode", "form_post");
  return url.toString();
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

    /*
    const passphraseList = niceware.generatePassphrase(8);
    tokenString = passphraseList.join('-')
    */
    tokenString = `${crypto.randomInt(100000, 999999)}`;
    const query = new Parse.Query("Token");
    query.equalTo("token", tokenString);
    const results = await query.find({useMasterKey:true});
    tokenExists = results.length != 0
  }

  const Token = Parse.Object.extend("Token");
  const tokenObject = new Token();

  const tokenObjectACL = new Parse.ACL();
  tokenObjectACL.setPublicReadAccess(false);
  tokenObject.setACL(tokenObjectACL);
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

  const queryStudyInterest = new Parse.Query("StudyInterest");
  queryStudyInterest.equalTo("studyToken", tokenString);
  const resultsStudyInterest = await queryStudyInterest.find({useMasterKey:true});
  if(resultsStudyInterest.length == 0)
  {
    console.log("Error - StudyInterest not in database!");

    //Search on sendgrid
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
  }

  let toBeSent = {};
  toBeSent['email'] = resultsStudyInterest[0].get("email");
  toBeSent['expireDate'] = expireDate;

  let customFields = {};

  customFields['consent_get_involved_formal_trial'] = resultsStudyInterest[0].get("formalTrial");
  customFields['consent_get_involved_study'] = resultsStudyInterest[0].get("study");
  customFields['consent_get_involved_smartphone_type'] = resultsStudyInterest[0].get("smartphoneType");

  toBeSent['custom_fields'] = customFields;

  return toBeSent;

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

  const assessmentObjectACL = new Parse.ACL();
  assessmentObjectACL.setPublicReadAccess(false);
  assessmentObject.setACL(assessmentObjectACL);

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
  assessmentObject.set("nmsqpart1", request.params.data.nmsqpart1);
  assessmentObject.set("nmsqpart2", request.params.data.nmsqpart2);
  assessmentObject.set("nmsqpart3", request.params.data.nmsqpart3);
  assessmentObject.set("nmsqpart4", request.params.data.nmsqpart4);

  /*
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
*/

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

function generateParticipantReference(name, ageRange) {
  //generate participant reference
  let splitName = name.split(" ");
  let initials = "";
  for(let i = 0; i < splitName.length; i++) {
    if(splitName[0].length > 0) {
      initials += splitName[i][0];
    }
  }

  let age = `${ageRange[0]}${ageRange[1]}`

  if(isNaN(age)) {
    age =  Math.floor(Math.random() * 100);
  }

  let yearOfBirth = new Date().getFullYear() - age;

  const hashCurrentDate = ((+new Date) + Math.random()* 1000).toString(36);

  return `${initials}${yearOfBirth}${hashCurrentDate}`;
}

Parse.Cloud.define("submitConsentAndDemographics", async (request) => {
  console.log("submitConsentAndDemographics");

  console.log("token", request.params.token);
  console.log("data", request.params.data);

  
  let participantReference = generateParticipantReference(request.params.data.c10, request.params.data.f1);

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
  consentObject.set("participantReference", participantReference);

  const consentObjectACL = new Parse.ACL();
  consentObjectACL.setPublicReadAccess(false);
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

  demographicsDataObject.set("parkinsons", request.params.data.f5);
  demographicsDataObject.set("drooling", request.params.data.f6);

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
  console.log("latestTestGroupFirmwareReleaseId:", latestTestGroupFirmwareRelease.firmwareReleaseId);

  const firmwareReleaseQuery = new Parse.Query("FirmwareRelease");
  const firmwareReleaseResult = await firmwareReleaseQuery.get(latestTestGroupFirmwareRelease.firmwareReleaseId, {useMasterKey:true});

  //const firmwareReleaseResult = await firmwareReleaseQuery.find({useMasterKey:true});
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

  console.log(firmwareRelease);

  return firmwareRelease ;
});


Parse.Cloud.define("getLatestAppRelease", async (request) => {

  const testGroupQuery = new Parse.Query("TestGroup")
  testGroupQuery.equalTo("name", "main");
  const testGroupResult = await testGroupQuery.find({useMasterKey:true});
  console.log("testGroupResult:", testGroupResult);
  if(testGroupResult.length == 0) {
    console.log("testGroupResult: Empty");
    return {};
  }

  var testgroupId = testGroupResult[0].id;
  const testGroupAppReleaseQuery = new Parse.Query("TestGroupAppRelease")
  testGroupAppReleaseQuery.equalTo("testGroupId", testgroupId);
  const testGroupAppReleaseResult = await testGroupAppReleaseQuery.find({useMasterKey:true});
  console.log("testGroupAppReleaseResult:", testGroupAppReleaseResult);
  if(testGroupAppReleaseResult.length == 0) {
    console.log("testGroupAppReleaseResult: Empty");
    return {};
  }

  var latestTestGroupAppReleaseAndroid = null
  var latestTestGroupAppReleaseAndroidOrder = -1; 
  
  var latestTestGroupAppReleaseIos = null
  var latestTestGroupAppReleaseIosOrder = -1; 
  
  testGroupAppReleaseResult.forEach(element => {

    var platform = element.get("platform");
    if(platform == "android" && element.get("order") > latestTestGroupAppReleaseAndroidOrder) {
      latestTestGroupAppReleaseAndroid = {
        id: element.id,
        appReleaseId: element.get("appReleaseId"),
        testGroupId: element.get("testGroupId"),
        text: element.get("text"),
        order: element.get("order"),
        platform: element.get("platform"),
      }
      latestTestGroupAppReleaseAndroidOrder = element.get("order");
    } else if (platform == "ios" && element.get("order") > latestTestGroupAppReleaseIosOrder) {
      latestTestGroupAppReleaseIos = {
        id: element.id,
        appReleaseId: element.get("appReleaseId"),
        testGroupId: element.get("testGroupId"),
        text: element.get("text"),
        order: element.get("order"),
        platform: element.get("platform"),
      }
      latestTestGroupAppReleaseIosOrder = element.get("order");
    }
  });

  console.log("latestTestGroupAppReleaseAndroid:", latestTestGroupAppReleaseAndroid);
  console.log("latestTestGroupAppReleaseIos:", latestTestGroupAppReleaseIos);

  var appReleaseAndroid = {};
  if(latestTestGroupAppReleaseAndroid != null) {
    const appReleaseAndroidQuery = new Parse.Query("AppRelease");
    const appReleaseAndroidResult = await appReleaseAndroidQuery.get(latestTestGroupAppReleaseAndroid.appReleaseId, {useMasterKey:true});
    console.log("appReleaseAndroidResult:", appReleaseAndroidResult);
  
    appReleaseAndroid = appReleaseAndroidResult != undefined ? {
      id: appReleaseAndroidResult.id,
      downloadLink: appReleaseAndroidResult.get("downloadLink"),
      version: appReleaseAndroidResult.get("version"),
      minFirmwareVersion: appReleaseAndroidResult.get("minFirmwareVersion"),
      maxFirmwareVersion: appReleaseAndroidResult.get("maxFirmwareVersion"),
      platform: appReleaseAndroidResult.get("platform"),
    } : {};
  
  }

  var appReleaseIos = {};
  if(latestTestGroupAppReleaseIos != null) {

    const appReleaseIosQuery = new Parse.Query("AppRelease");
    const appReleaseIosResult = await appReleaseIosQuery.get(latestTestGroupAppReleaseIos.appReleaseId, {useMasterKey:true});
    console.log("appReleaseIosResult:", appReleaseIosResult);
  
    appReleaseIos = appReleaseIosResult != undefined ? {
      id: appReleaseIosResult.id,
      downloadLink: appReleaseIosResult.get("downloadLink"),
      version: appReleaseIosResult.get("version"),
      minFirmwareVersion: appReleaseIosResult.get("minFirmwareVersion"),
      maxFirmwareVersion: appReleaseIosResult.get("maxFirmwareVersion"),
      platform: appReleaseIosResult.get("platform"),
    } : {};
  }

  return [appReleaseAndroid, appReleaseIos];
});


async function formatAndStoreConsentForm(consentQueryResult) {

  var dataForCSV = [];
    
  for(let i = 0; i < consentQueryResult.length; i++) {
    let consentData = consentQueryResult[i];

    const userData = {
      name: consentData.get("name"),
      id: consentData.get("participantReference"),
      consentFormFilledDate: consentData.get("createdAt")
    };

    const token = consentData.get("token");
    const demographicsDataQuery = new Parse.Query("DemographicsData")
    demographicsDataQuery.equalTo("token", token);
    const demographicsDataQueryResult = await demographicsDataQuery.find({useMasterKey:true});
    if(demographicsDataQueryResult.length == 0) {
      userData['YearOfBirth'] = "Demographics data not found";
    } else {
      const ageRange = demographicsDataQueryResult[0].get("ageRange");
      if(ageRange == null) {
        userData['YearOfBirth'] = "Not disclosed by participant";
      }
      const ageRangeString = ageRange.substring(0,2);
      userData['YearOfBirth'] = isNaN(ageRangeString) ? "Not disclosed by participant" : new Date().getFullYear() - Number(ageRangeString);
    }
    dataForCSV.push(userData);
  }

  let csvContent = "Id,Name,YearOfBirth,ConsentFormFilledDate\n"
  dataForCSV.forEach(data => {
    csvContent += `${data.id},${data.name},${data.YearOfBirth},${data.consentFormFilledDate}\n`
  });

  const currentDate = new Date()
  let ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(currentDate);
  let mo = new Intl.DateTimeFormat('en', { month: 'short' }).format(currentDate);
  let da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(currentDate);

  const randomFileName = crypto.randomBytes(10).toString('hex');

  const filename = `ParticipantReport${da}${mo}${ye}.${randomFileName}.csv`;

  const file = new Parse.File(filename, {base64: Buffer.from(csvContent).toString('base64')});
  
  try {
    var saveFileResult = await file.save();
    if(saveFileResult.code != null) {
      return;
    }

    console.log(file.url());
    console.log("The file has been saved to Parse.")
    const ConsentReport = Parse.Object.extend("ConsentReport");
    const consentReportObject = new ConsentReport();

    const consentReportObjectACL = new Parse.ACL();
    consentReportObjectACL.setPublicReadAccess(false);

    consentReportObject.setACL(consentReportObjectACL);
    consentReportObject.set("endDate", new Date());
    consentReportObject.set("csvFile", file);
    await consentReportObject.save();

    /*
    const newParticipantsEmailAddresses = process.env.NEW_PARTICIPANTS_REPORTS_EMAIL_LIST;
    let newParticipantsEmailAddressesSplit = newParticipantsEmailAddresses.split(",");

    const emailBody = {
        to: newParticipantsEmailAddressesSplit,
        from: process.env.EMAIL_SENDER,
        templateId: process.env.NEW_PARTICIPANTS_REPORTS_TEMPLATE_ID,
        dynamicTemplateData: {
            periodStart: consentReportObject.get("startDate"),
            periodEnd: consentReportObject.get("endDate"),
            csvlink: `${file.url()}`,
        },
    }

    try {
        console.log(emailBody);
        const result = await sgMail.send(emailBody);
        console.log(result);
        console.log(`${new Date().toUTCString()} sendConfirmationEmail finished`);
    } catch (error) {
        console.log(`${new Date().toUTCString()} sendConfirmationEmail exception ${error}`);
    }*/

    return consentReportObject;

  } catch(e) {
    console.log("The file either could not be read, or could not be saved to Parse.", e)
  }

  console.log(dataForCSV);
}

Parse.Cloud.define("generateConsentReport", async (request) => {

  try {
    const consentReportQuery = new Parse.Query("ConsentReport")
    consentReportQuery.descending('endDate');
    const consentReportQueryResult = await consentReportQuery.find({useMasterKey:true});
    if(consentReportQueryResult.length == 0) {
      console.log("No consent reports found.");
      const consentQuery = new Parse.Query("Consent")
      const consentQueryResult = await consentQuery.find({useMasterKey:true});
      if(consentQueryResult.length == 0) {
        return [];
      } else {
        let result = await formatAndStoreConsentForm(consentQueryResult);
        return result;
      }
    } else {
      let endDate = consentReportQueryResult[0].get("endDate");

      const consentQuery = new Parse.Query("Consent");
      const consentQueryResult = await consentQuery.find({useMasterKey:true});

      if(consentQueryResult.length != 0) {
        var consentQueryFiltered = consentQueryResult.filter((element) => {
          return element.get("createdAt") >= endDate; 
        });
        if(consentQueryFiltered.length == 0) {
          return [];
        }
        let result = await formatAndStoreConsentForm(consentQueryFiltered);

        result.set("startDate", endDate);
        await result.save();

        return result;
      }
      return [];
    }
  } catch(e) {
    console.log(e);
  }
}, {
  requireMaster: true
});

// Fisher-Yates (aka Knuth) Shuffle.
function shuffle(array) {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}


Parse.Cloud.define("generateRandomAllocations", async (request) => {

  if(request.params.nAllocations == null) {
    return "nAllocations parameter missing.";
  }

  const randomAllocationQuery = new Parse.Query("RandomAllocation");
  randomAllocationQuery.descending('order');
  const randomAllocationResult = await randomAllocationQuery.find({useMasterKey:true});
  let startingOrder = 0;
  if(randomAllocationResult.length != 0) {
    startingOrder = randomAllocationResult[0].get("order");
    startingOrder++;
  }

  const nAllocations = request.params.nAllocations;
  let halfAllocations = nAllocations / 2;
  const arrayAllocations = [];

  for(let i = 0; i < nAllocations; i++) {
    if(i < halfAllocations) {
      arrayAllocations.push("CueBand-Phone");
    } else {
      arrayAllocations.push("Phone-CueBand");
    }
  }

  let arrayAllocationsShuffled = shuffle(arrayAllocations);
  for(let i = 0; i < arrayAllocationsShuffled.length; i++) {
    const RandomAllocation = Parse.Object.extend("RandomAllocation");
    const randomAllocationObject = new RandomAllocation();

    const randomAllocationObjectACL = new Parse.ACL();
    randomAllocationObjectACL.setPublicReadAccess(false);
    randomAllocationObject.setACL(randomAllocationObjectACL);

    randomAllocationObject.set("type", arrayAllocationsShuffled[i]);
    randomAllocationObject.set("order", startingOrder + i);
    randomAllocationObject.set("allocated", false);
    await randomAllocationObject.save();
  }

  return "done";

}, {
  requireMaster: true
});

Parse.Cloud.define("resendConfirmationEmail", async () => {
  const studyInterestQuery = new Parse.Query("StudyInterest");
  studyInterestQuery.equalTo("activated", false);
  const studyInterestQueryResult = await studyInterestQuery.find({useMasterKey:true});
  if(studyInterestQueryResult.length == 0) {
    return true;
  }

  for(let i = 0; i < studyInterestQueryResult.length; i++) {
    const email = studyInterestQueryResult[i].get("email");
    const confirmEmailEndpoint = '/confirm-email'; 
    const emailBody = {
        to: email,
        from: {
          email: process.env.EMAIL_SENDER,
          name: "Cue Band"
        },
        templateId: process.env.CONFIRM_EMAIL_TEMPLATE_ID,
        dynamicTemplateData: {
            tokenLink: `${process.env.DOMAIN_URL}${confirmEmailEndpoint}?token=${activationToken}`,
            email,
        },
    }

    try {
        await sgMail.send(emailBody);
        return true;
    } catch (error) {
        console.error(error);
        if (error.response) {
            console.error(error.response.body)
        }
        return false;
    }
  }
  return true;
},{
  requireMaster: true
});


Parse.Cloud.define("sendStudyStartEmail", async (request) => {

  if(request.params.email == null || request.params.email == "" ||
    request.params.smartphoneType == null || request.params.smartphoneType == "" ||
    request.params.studyToken == null || request.params.studyToken == "" ||
    request.params.link == null || request.params.link == "") {
    return {
      "code": 141,
      "error": "No required parameters provided (email, smartphoneType, studyToken, link)"
    };
  }

    let emailBody = null;
    if(request.params.smartphoneType == "android") {
      emailBody = {
        to: request.params.email,
        from: {
          email: process.env.EMAIL_SENDER,
          name: "Cue Band",
        },
        templateId: process.env.STUDY_START_ANDROID_TEMPLATE_ID,
        dynamicTemplateData: {
            link: request.params.link,
            studyToken: request.params.studyToken 
        },
      }
    } else if (request.params.smartphoneTypee == "ios") {
      emailBody = {
        to: email,
        from: {
          email: process.env.EMAIL_SENDER,
          name: "Cue Band",
        },
        templateId: process.env.STUDY_START_IOS_TEMPLATE_ID,
        dynamicTemplateData: {
            link: request.params.link,
            studyToken: request.params.studyToken 
        },
      }
    } else {
      console.log('Invalid Smartphone type');
      return {
        "code": 141,
        "error": "Invalid start phone type"
      };
    }

    try {
        var result = await sgMail.send(emailBody);
        console.log(result);
        return true;
    } catch (error) {
        console.error(error);
        if (error.response) {
            console.error(error.response.body)
        }

        return {
          "code": 141,
          error
        };
    }
},{
  requireMaster: true
});

/*
Parse.Cloud.define("sendStudyStartEmail", async (sentToGoogleUsers, sendToIosUsers) => {
  const studyInterestActivatedQuery = new Parse.Query("StudyInterest");
  studyInterestActivatedQuery.equalTo("activated", true);

  const studyInterestAndroidQuery = new Parse.Query("StudyInterest");
  studyInterestAndroidQuery.equalTo("smartphoneType", "android");

  const studyInterestIosQuery = new Parse.Query("StudyInterest");
  studyInterestIosQuery.equalTo("smartphoneType", "ios");

  let smartphoneTypeQuery = null;
  if(sentToGoogleUsers && sendToIosUsers) {
    smartphoneTypeQuery = Parse.Query.or(studyInterestAndroidQuery, studyInterestIosQuery);
  } else if (sentToGoogleUsers) {
    smartphoneTypeQuery = studyInterestAndroidQuery;
  } else if (sendToIosUsers) {
    smartphoneTypeQuery = studyInterestIosQuery;
  }

  const studyInteresQuery = Parse.Query.and(studyInterestActivatedQuery, smartphoneTypeQuery);
  const studyInterestQueryResult = await studyInteresQuery.find({useMasterKey:true});
  if(studyInterestQueryResult.length == 0) {
    return true;
  }

  for(let i = 0; i < studyInterestQueryResult.length; i++) {

    const email = studyInterestQueryResult[i].get("email");
    const smartphoneType = studyInterestQueryResult[i].get("smartphoneType");
    const studyToken = studyInterestQueryResult[i].get("studyToken");

    let emailBody = null;
    if(smartphoneType == "android") {
      emailBody = {
        to: email,
        from: process.env.EMAIL_SENDER,
        templateId: process.env.STUDY_START_ANDROID_TEMPLATE_ID,
        dynamicTemplateData: {
            androidLink: process.env.ANDROID_STORE_URL,
            studyToken 
        },
      }
    } else if (smartphoneType == "ios") {
      emailBody = {
        to: email,
        from: process.env.EMAIL_SENDER,
        templateId: process.env.STUDY_START_IOS_TEMPLATE_ID,
        dynamicTemplateData: {
            androidLink: process.env.IOS_STORE_URL,
            studyToken 
        },
      }
    } else {
      console.log('Invalid Smartphone type');
      return false;
    }

    try {
        await sgMail.send(emailBody);
        return true;
    } catch (error) {
        console.error(error);
        if (error.response) {
            console.error(error.response.body)
        }
        return false;
    }
  }
  return true;
},{
  requireMaster: true
});
*/

Parse.Cloud.define("didConsentForm", async (request) => {

  if(request.params.consentToken == null || request.params.consentToken == "") {
    return {
      "code": 141,
      "error": "No token provided"
    };
  }

  console.log("token", request.params.consentToken);

  const query = new Parse.Query("Consent");
  query.equalTo("token", request.params.consentToken);
  const results = await query.find({useMasterKey: true});

  if(results.length == 0) {
    return false;
  }
  
  const queryDemographics = new Parse.Query("DemographicsData");
  queryDemographics.equalTo("token", request.params.consentToken);
  const demographicsResult = await queryDemographics.find({useMasterKey: true});

  return demographicsResult.length != 0;
});


Parse.Cloud.define("sendDeviceSentEmail", async (request) => {
  
  if(request.params.email == null || request.params.email == "" 
      || request.params.address == null || request.params.address == ""
      || request.params.trackingCode == null || request.params.trackingCode == "") {
    return {
      "code": 141,
      "error": "No required parameters provided (email, address, trackingCode)"
    };
  }

  let emailBody = {
    to: request.params.email ,
    from: {
      email: process.env.EMAIL_SENDER,
      name: "Cue Band"
    },
    templateId: process.env.DEVICE_SENT_TEMPLATE_ID,
    dynamicTemplateData: {
        email: request.params.email,
        address: request.params.address,
        trackingCode: request.params.trackingCode
    },
  }

  try {
    await sgMail.send(emailBody);
    return {
      "code": 200,
    };
  } catch (error) {
    console.error(error);
    if (error.response) {
        console.error(error.response.body)
    }
    return  {
      "code": 141,
      "error": error
    };
  }
},{
  requireMaster: true
});

Parse.Cloud.define("sendBranchEmail", async (request) => {
  
  if(request.params.email == null || request.params.email == "" 
      || request.params.branch == null || request.params.branch == "") {
    return {
      "code": 141,
      "error": "No required parameters provided (email, branch)"
    };
  }

  let templateId = request.params.branch == "trial" ? process.env.ACCEPTED_TRIAL_TEMPLATE_ID : process.env.ACCEPTED_FREELIVING_TEMPLATE_ID

  let emailBody = {
    to: request.params.email ,
    from: {
      email: process.env.EMAIL_SENDER,
      name: "Cue Band"
    },
    templateId: templateId,
    dynamicTemplateData: {
        email: request.params.email,
    },
  }

  try {
    await sgMail.send(emailBody);
    return {
      "code": 200,
    };
  } catch (error) {
    console.error(error);
    if (error.response) {
        console.error(error.response.body)
    }
    return  {
      "code": 141,
      "error": error
    };
  }
},{
  requireMaster: true
});


Parse.Cloud.define("bulkTest", async (request) => {
  
  try {
    const studyInterestQuery = new Parse.Query("StudyInterest");
    studyInterestQuery.equalTo("activated", true);
    const studyInterestQueryResult = await studyInterestQuery.find({useMasterKey:true});

    studyInterestQueryResult.forEach(result => {
      console.log(result.get("email"), result.get("studyToken"));
    });

  } catch (error) {
    console.error(error);
    if (error.response) {
      console.error(error.response.body)
    }
    return {
      "code": 141,
      error
    };
  }
},{
  requireMaster: true
});


Parse.Cloud.define("bulkSendStudyStartEmail", async (request) => {
  
  try {
    const studyInterestQuery = new Parse.Query("StudyInterest");
    studyInterestQuery.equalTo("activated", true);
    studyInterestQuery.limit(1000);
    studyInterestQuery.skip(100);
    const studyInterestQueryResult = await studyInterestQuery.find({useMasterKey:true});

    let personalizations = [];

    studyInterestQueryResult.forEach(result => {
      console.log(result.get("email"), result.get("studyToken"));
      var token = result.get("studyToken");
      personalizations.push({
        to: [result.get("email")],
        dynamicTemplateData: {
          link: `https://cue.band/app`,
          studyToken: token,
          faq: "https://faq.cue.band/"
        }
      });
    });

    let messages = [];
    if (personalizations.length > 0) {
      messages.push({
        personalizations: personalizations,
        from: {
          email: process.env.EMAIL_SENDER,
          name: "Cue Band",
        },
        templateId: process.env.STUDY_START_ANDROID_TEMPLATE_ID
      });
    }

    var result = await sgMail.send(messages);
    console.log(result);
    return true;
  } catch (error) {
    console.error(error);
    if (error.response) {
      console.error(error.response.body)
    }
    return {
      "code": 141,
      error
    };
  }
},{
  requireMaster: true
});


Parse.Cloud.define("sendWaitingEmail", async (request) => {

  if(request.params.email == null || request.params.email == "") {
    return {
      "code": 141,
      "error": "No required parameters provided (email)"
    };
  }
  
  try {
   
    let emailBody = {
      to: request.params.email ,
      from: {
        email: process.env.EMAIL_SENDER,
        name: "Cue Band"
      },
      templateId: process.env.WAITING_EMAIL
    }
  
    try {
      await sgMail.send(emailBody);
      return {
        "code": 200,
      };
    } catch (error) {
      console.error(error);
      if (error.response) {
          console.error(error.response.body)
      }
      return  {
        "code": 141,
        "error": error
      };
    }
  } catch (error) {
    console.error(error);
    if (error.response) {
      console.error(error.response.body)
    }
    return {
      "code": 141,
      error
    };
  }
},{
  requireUser: true
});


Parse.Cloud.define("sendNotAcceptedEmail", async (request) => {

  if(request.params.email == null || request.params.email == "") {
    return {
      "code": 141,
      "error": "No required parameters provided (email)"
    };
  }
  
  try {
   
    let emailBody = {
      to: request.params.email ,
      from: {
        email: process.env.EMAIL_SENDER,
        name: "Cue Band"
      },
      templateId: process.env.NOT_ACCEPTED_TEMPLATE_ID
    }
  
    try {
      await sgMail.send(emailBody);
      return {
        "code": 200,
      };
    } catch (error) {
      console.error(error);
      if (error.response) {
          console.error(error.response.body)
      }
      return  {
        "code": 141,
        "error": error
      };
    }
  } catch (error) {
    console.error(error);
    if (error.response) {
      console.error(error.response.body)
    }
    return {
      "code": 141,
      error
    };
  }
},{
  requireMaster: true
});


//Function that calculates number of missing header blocks
Parse.Cloud.define("calculateMissingHeaderBlocks", async (request) => {
    
  if(request.params.userId == null || request.params.userId == "") {
    return {
      "code": 141,
      "error": "No required parameters provided (userId)"
    };
  }

  const MissingHeaderBlocksCounterQuery = new Parse.Query("MissingHeaderBlocksCounter");
  MissingHeaderBlocksCounterQuery.equalTo("user", request.params.userId);
  let missingHeaderBlocksCounter = await MissingHeaderBlocksCounterQuery.first({useMasterKey:true});

  let missingBlocks = []
  if(missingHeaderBlocksCounter != null && missingHeaderBlocksCounter.get("missingHeaderBlocksArray") != null && missingHeaderBlocksCounter.get("missingHeaderBlocksArray").length > 0) {
    missingBlocks = missingHeaderBlocksCounter.get("missingHeaderBlocksArray");
    missingHeaderBlocksCounter.set("missingHeaderBlocksArray", []);
    missingHeaderBlocksCounter.set("missingHeaderBlocks", 0);
    missingHeaderBlocksCounter.set("lastUpdate", new Date());
    await missingHeaderBlocksCounter.save(null, {useMasterKey:true});

    const SentMissingHeaderBlocksCounter = Parse.Object.extend("SentMissingHeaderBlocksCounter");
    let SentMissingHeaderBlocksCounterObject = new SentMissingHeaderBlocksCounter();
    SentMissingHeaderBlocksCounterObject.set("user", request.params.userId);
    SentMissingHeaderBlocksCounterObject.set("missingHeaderBlocksArray", missingBlocks);
    SentMissingHeaderBlocksCounterObject.set("missingHeaderBlocks", missingBlocks.length);
    SentMissingHeaderBlocksCounterObject.set("lastUpdate", new Date());

    const SentMissingHeaderBlocksCounterACL = new Parse.ACL();
    SentMissingHeaderBlocksCounterACL.setPublicReadAccess(false);
    SentMissingHeaderBlocksCounterObject.setACL(SentMissingHeaderBlocksCounterACL);

    await SentMissingHeaderBlocksCounterObject.save(null, {useMasterKey:true});
  }

  return {
    "code": 200,
    "missingHeaderBlocks": missingBlocks
  };
    
    /*

    //get user
    const userQuery = new Parse.Query(Parse.User);
    userQuery.equalTo("objectId", request.params.userId);
    const user = await userQuery.first({useMasterKey:true});

    try {
      const activityLogBlockHeaderCountQuery = new Parse.Query("ActivityLogBlockHeader");
      activityLogBlockHeaderCountQuery.equalTo("user", user);
      const studyInterestQueryCountResult = await activityLogBlockHeaderCountQuery.count({useMasterKey:true});
      if(studyInterestQueryCountResult == null) {
        return {
          "code": 141,
          "error": "No ActivityLogBlockHeaders found with the given user"
        };
      }
      const numberOfPages = Math.ceil(studyInterestQueryCountResult / 1000);
      
      let localIds = [];
      let missingSamples = [];

      for(let i = 0; i < numberOfPages; i++) {
        const activityLogBlockHeaderQuery = new Parse.Query("ActivityLogBlockHeader");
        activityLogBlockHeaderQuery.equalTo("user", user);
        activityLogBlockHeaderQuery.ascending("localId");
        activityLogBlockHeaderQuery.limit(1000);
        activityLogBlockHeaderQuery.skip(i * 1000);
        const studyInterestQueryResult = await activityLogBlockHeaderQuery.find({useMasterKey:true});
        if(studyInterestQueryResult != null) {
          localIds = localIds.concat(studyInterestQueryResult.map((elem) => elem.get("localId")));
          missingSamples = missingSamples.concat(studyInterestQueryResult.filter((elem) => elem.get("count") < 28).map((elem) => elem.get("localId")));
        }
      }

      //order by timestamp
      //device blockId
      //
  
      localIds = localIds.sort((a, b) => a - b);
      localIds = [...new Set(localIds)];

      let missingBlocks = [];
      for(let i = 0; i < localIds[localIds.length - 1]; i++) {
        let result = localIds.find((elem) => elem == i);
        if(result == null) {
          missingBlocks.push(i);
        }
      }

      missingBlocks = missingBlocks.concat(missingSamples);
      missingBlocks = [...new Set(missingBlocks)];

      //get lost headers blocks
      const lostHeaderBlocksCounterQuery = new Parse.Query("LostHeaderBlocksCounter");
      lostHeaderBlocksCounterQuery.equalTo("user", request.params.userId);
      let lostHeaderBlocksCounter = await lostHeaderBlocksCounterQuery.first({useMasterKey:true});
      if(lostHeaderBlocksCounter != null) {
        let lostList = lostHeaderBlocksCounter.get('lostHeaderBlocksArray');
        for(let i = 0; i < lostList.length; i++) {
          let lostIndex = missingBlocks.indexOf(lostList[i]);
          if(lostIndex != -1) {
            missingBlocks.splice(lostIndex, 1);
          }
        }
      }

      //add entry to MissingHeaderBlocksCounter
      const MissingHeaderBlocksCounterQuery = new Parse.Query("MissingHeaderBlocksCounter");
      MissingHeaderBlocksCounterQuery.equalTo("user", request.params.userId);
      let missingHeaderBlocksCounter = await MissingHeaderBlocksCounterQuery.first({useMasterKey:true});
      if(missingHeaderBlocksCounter == null) {
        const MissingHeaderBlocksCounter = Parse.Object.extend("MissingHeaderBlocksCounter");
         missingHeaderBlocksCounter = new MissingHeaderBlocksCounter();
      }
      missingHeaderBlocksCounter.set("user", request.params.userId);
      missingHeaderBlocksCounter.set("missingHeaderBlocks", missingBlocks.length);
      missingHeaderBlocksCounter.set("missingHeaderBlocksArray", missingBlocks);
      missingHeaderBlocksCounter.set("lastUpdate", new Date());
      await missingHeaderBlocksCounter.save(null, {useMasterKey:true});

      

      return {
        "code": 200,
        "missingHeaderBlocks": missingBlocks
      };
    } catch (error) {
      console.error(error);
      if (error.response) {
        console.error(error.response.body)
      }
      return {
        "code": 141,
        error
      };
    }
    */
});




