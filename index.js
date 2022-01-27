// Example express application adding the parse-server module to expose Parse
// compatible API routes.

const express = require('express');
const ParseServer = require('parse-server').ParseServer;
const path = require('path');
const args = process.argv || [];
const test = args.some(arg => arg.includes('jasmine'));
var dotenv = require('dotenv');
var cors = require('cors');

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
app.use('/public', express.static(path.join(__dirname, '/public')));

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
app.get('/test', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
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

const cueingIntervalSchema = require('./schemas/CueingIntervalSchema');
cueingIntervalSchema.CreateSchema();

const activityLogBlockHeaderSchema = require('./schemas/ActivityLogBlockHeaderSchema');
activityLogBlockHeaderSchema.CreateSchema();

const ActivityLogBlockSampleSchema = require('./schemas/ActivityLogBlockSampleSchema');
ActivityLogBlockSampleSchema.CreateSchema();

const ConsentSchema = require('./schemas/ConsentSchema');
ConsentSchema.CreateSchema();

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

module.exports = {
  app,
  config,
};

