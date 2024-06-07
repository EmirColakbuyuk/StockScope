const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');  // Ensure the path is correct

// User routes
router.post('/users', userController.addUser);  // Public route (assuming registration doesn't need auth)
router.delete('/users/:id', auth, userController.deleteUser);  // Protected route
router.put('/users/:id/role', auth, userController.updateUserAccessLevel);  // Protected route
router.put('/users/:id', auth, userController.updateUser);  // Protected route

module.exports = router;
