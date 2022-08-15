// Example express application adding the parse-server module to expose Parse
// compatible API routes.

const express = require('express');
const ParseServer = require('parse-server').ParseServer;
const path = require('path');
const args = process.argv || [];
const test = args.some(arg => arg.includes('jasmine'));
var dotenv = require('dotenv');
var cors = require('cors');
var cron = require('node-cron');

const result = dotenv.config()
if (result.error) {
  throw result.error
}

const requiredEnvVariables = [process.env.SENDGRID_API_KEY, process.env.DOMAIN_URL, process.env.EMAIL_SENDER, 
  process.env.CONFIRM_EMAIL_TEMPLATE_ID,  process.env.TOKEN_ERROR_REDIRECT_URL, 
  process.env.TOKEN_ACTIVATED_REDIRECT_URL, process.env.CONTACT_LIST_NAME];

for(const variable of requiredEnvVariables) {
  if(variable == undefined)
    throw Error('Required env variable missing!');
}

const databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}
const config = {
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  masterKey: process.env.MASTER_KEY || 'test', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse', // Don't forget to change to https if needed
  restApiKey: process.env.REST_API_KEY || 'test',
  liveQuery: {
    classNames: ['Posts', 'Comments'], // List of classes to support for query subscriptions
  },
  allowCustomObjectId: false,
  allowClientClassCreation: false
};
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

var interestRouter = require('./routes/interest');
app.use(interestRouter);

const signinRoutes = require('./routes/signin');
app.use(signinRoutes);

// Serve static assets from the /public folder
app.use('/', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
const mountPath = process.env.PARSE_MOUNT || '/parse';
if (!test) {
  const api = new ParseServer(config);
  app.use(mountPath, api);
}

// Parse Server plays nicely with the rest of your web routes
app.get('/', function (req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
/*
app.get('/test', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});
*/

app.get('/assessment', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/assessment.html'));
});

app.get('/consent', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/consent.html'));
});

app.get('/informationsheet', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/informationsheet.html'));
});

app.get('/firmware', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/firmware'));
});

app.get('/apple', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/apple.html'));
});

const port = process.env.PORT || 1337;
if (!test) {
  const httpServer = require('http').createServer(app);
  httpServer.listen(port, function () {
    console.log('parse-server-example running on port ' + port + '.');
  });
  // This will enable the Live Query real-time server
  ParseServer.createLiveQueryServer(httpServer);
}


setAdminUser= async() => {

  const roleQuery = new Parse.Query(Parse.Role);
  roleQuery.equalTo("name", "Admin");
  const roleQueryResults = await roleQuery.find({ useMasterKey: true });
  var adminRole = null;
  if(roleQueryResults .length == 0) {
    //Set role
    const roleACL = new Parse.ACL();
    roleACL.setPublicReadAccess(true);
    roleACL.setPublicWriteAccess(true);
    adminRole = new Parse.Role("Admin", roleACL);
    adminRole.save({ useMasterKey: true });
  } else {
    adminRole = roleQueryResults[0];
  }

  //User exists
  const userQuery = new Parse.Query(Parse.User);
  userQuery.equalTo("username", process.env.ADMIN_USERNAME);
  const userQueryResults = await userQuery.find({ useMasterKey: true });

  if(userQueryResults.length == 0) {
    //Create admin user
    const adminUser = new Parse.User();
    adminUser.set("username", process.env.ADMIN_USERNAME);
    adminUser.set("password", process.env.ADMIN_PASSWORD);
    adminUser.set("email", process.env.ADMIN_EMAIL);
    try {
      await adminUser.signUp({ useMasterKey: true });
      adminRole.getUsers().add(adminUser);
      adminRole.save({ useMasterKey: true });
    } catch (error) {
      // Show the error message somewhere and let the user try again.
      console.log("Error: " + error.code + " " + error.message);
    }
  }
}

setAdminUser();

const cueingIntervalSchema = require('./schemas/CueingIntervalSchema');
cueingIntervalSchema.CreateSchema();

const activityLogBlockHeaderSchema = require('./schemas/ActivityLogBlockHeaderSchema');
activityLogBlockHeaderSchema.CreateSchema();

const ActivityLogBlockSampleSchema = require('./schemas/ActivityLogBlockSampleSchema');
ActivityLogBlockSampleSchema.CreateSchema();

const ConsentSchema = require('./schemas/ConsentSchema');
ConsentSchema.CreateSchema();

const DemographicsDataSchema = require('./schemas/DemographicsDataSchema');
DemographicsDataSchema.CreateSchema();

const StudyDataSchema = require('./schemas/StudyDataSchema');
StudyDataSchema.CreateSchema();

const DiaryEntrySchema = require('./schemas/DiaryEntrySchema');
DiaryEntrySchema.CreateSchema();

const FeedbackEntrySchema = require('./schemas/FeedbackEntrySchema');
FeedbackEntrySchema.CreateSchema();

const DeliveryAddressSchema = require('./schemas/DeliveryAddressSchema');
DeliveryAddressSchema .CreateSchema();

const TokenSchema = require('./schemas/TokenSchema');
TokenSchema.CreateSchema();

const AssessmentSchema = require('./schemas/AssessmentSchema');
AssessmentSchema.CreateSchema();

const PostSchema = require('./schemas/PostSchema');
PostSchema.CreateSchema();

const AppFeedbackSchema = require('./schemas/AppFeedbackSchema');
AppFeedbackSchema.CreateSchema();

const StudyInterestSchema = require('./schemas/StudyInterestSchema');
StudyInterestSchema.CreateSchema();

const FirmwareReleaseSchema = require('./schemas/FirmwareReleaseSchema');
FirmwareReleaseSchema.CreateSchema();

const AppReleaseSchema = require('./schemas/AppReleaseSchema');
AppReleaseSchema.CreateSchema();

const TestGroupAppRelease = require('./schemas/TestGroupAppReleaseSchema');
TestGroupAppRelease.CreateSchema();

const TestGroupFirmwareRelease = require('./schemas/TestGroupFirmwareReleaseSchema');
TestGroupFirmwareRelease.CreateSchema();

const TestGroupSchema = require('./schemas/TestGroupSchema');
TestGroupSchema.CreateSchema();

const UserTestGroupSchema = require('./schemas/UserTestGroupSchema');
UserTestGroupSchema.CreateSchema();

const AppLogSchema = require('./schemas/AppLogSchema');
AppLogSchema.CreateSchema();

const WearableDeviceSchema = require('./schemas/WearableDeviceSchema');
WearableDeviceSchema.CreateSchema();

const DeviceBoxSchema = require('./schemas/DeviceBoxSchema');
DeviceBoxSchema.CreateSchema();

const DeviceOrderSchema = require('./schemas/DeviceOrderSchema');
DeviceOrderSchema.CreateSchema();

const PostStudyQuestionnaireSchema = require('./schemas/PostStudyQuestionnaireSchema');
PostStudyQuestionnaireSchema.CreateSchema();

const LeftStudySchema = require('./schemas/LeftStudySchema');
LeftStudySchema.CreateSchema();

const ConsentReportSchema = require('./schemas/ConsentReportSchema');
ConsentReportSchema.CreateSchema();

const RandomAllocationSchema = require('./schemas/RandomAllocationSchema');
RandomAllocationSchema.CreateSchema();

cron.schedule('5 * * * * *', async () => {
  console.log('running a task every minute');
  try {

    const currentUser = Parse.User.current();
    if (!currentUser) {
      console.log("user not logged");
      const user = await Parse.User.logIn(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
      if(!user) {
        console.log("Could not log in admin");
        return;
      }
    } 

    const result = await Parse.Cloud.run("generateConsentReport", {}, {useMasterKey: process.env.MASTER_KEY});
    console.log(result);
  } catch(e) {
    console.log(e);
  }
});

module.exports = {
  app,
  config,
};

