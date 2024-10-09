const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); 
const loggerModule = require('../middleware/logger'); 

// Now use authController.login correctly
router.post('/login', loggerModule.logger, authController.login);

module.exports = router;
