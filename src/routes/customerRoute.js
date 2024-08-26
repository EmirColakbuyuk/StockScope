const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth');

router.post('/addCustomer', auth, customerController.createCustomer);
router.get('/getCustomer/:id', auth, customerController.getCustomerById);
router.put('/updateCustomer/:id', auth, customerController.updateCustomer);
router.delete('/deleteCustomer/:id', auth, customerController.deleteCustomer);
router.get('/allPurchaseHistory', auth, customerController.getAllPurchaseHistory);
router.get('/purchasesByCustomer/:id', auth, customerController.getPurchasesByCustomer);
router.get('/getAllCustomers', auth, customerController.getAllCustomers);
router.get('/getAllCustomersWithPagination', auth, customerController.getAllCustomersWithPagination);
router.get('/filterCustomers', auth, customerController.filterCustomers);
router.get('/searchNotesCustomers', auth, customerController.searchNotesCustomers); // Yeni eklenen rota


module.exports = router;
