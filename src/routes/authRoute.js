const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');


// Define the login route
router.post('/login', authController.login);

module.exports = router;
