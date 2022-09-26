const { request } = require('express');
const express = require('express');
const router = express.Router();

const signInController = require('../controllers/oAuthSignIn');

router.get('/google-signin', signInController.getGoogleToken);
router.post('/apple-signin', signInController.postAppleToken);

module.exports = router;