const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth');

router.post('/addCustomer', auth, customerController.createCustomer);
router.get('/getCustomer/:id', auth, customerController.getCustomerById);
router.put('/updateCustomer/:id', auth, customerController.updateCustomer);
router.delete('/deleteCustomer/:id', auth, customerController.deleteCustomer);

module.exports = router;
