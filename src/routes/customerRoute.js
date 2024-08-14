const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth');

router.post('/addCustomer', auth, customerController.createCustomer);
router.get('/getCustomer/:id', auth, customerController.getCustomerById);
router.put('/updateCustomer/:id', auth, customerController.updateCustomer);
router.delete('/deleteCustomer/:id', auth, customerController.deleteCustomer);
router.get('/allCustomers', auth, customerController.getCustomers);
router.get('/allPurchaseHistory', auth, customerController.getAllPurchaseHistory);
router.get('/purchasesByCustomer/:id', auth, customerController.getPurchasesByCustomer);

module.exports = router;
