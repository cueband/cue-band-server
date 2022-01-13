const { request } = require('express');
const express = require('express');
const router = express.Router();

const signInController = require('../controllers/oAuthSignIn');

router.post('/google-signin', signInController.getGoogleToken);

module.exports = router;