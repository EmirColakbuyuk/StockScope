const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');


router.post('/login', authController.login);

module.exports = router;
