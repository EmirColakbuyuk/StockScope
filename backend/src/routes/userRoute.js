const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');  // Ensure the path is correct
const roleAccess = require('../middleware/roleAccess');
const loggerModule = require('../middleware/logger');

// User routes
router.post('/add-user', auth, loggerModule.logger, userController.addUser);  // Public route (assuming registration doesn't need auth)
router.delete('/delete-user/:id', auth, loggerModule.logger, userController.deleteUser);  // Updated route for deleting user
router.put('/users/:id/role', auth, userController.updateUserAccessLevel);  // Protected route
router.put('/users/:id', auth, loggerModule.logger, userController.updateUser);  // Protected route
router.get('/users/:id', auth, userController.getUser);  // Protected route to get user info
router.get('/users', auth, userController.getAllUsers); // Tüm kullanıcıları getirmek için

module.exports = router;
