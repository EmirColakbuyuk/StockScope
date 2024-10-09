const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth');
const roleAccess = require('../middleware/roleAccess');
const loggerModule = require('../middleware/logger');

router.post('/addCustomer', auth, loggerModule.logger, customerController.createCustomer);
router.get('/getCustomer/:id', auth, customerController.getCustomerById);
router.put('/updateCustomer/:id', auth, loggerModule.logger, customerController.updateCustomer);
router.delete('/deleteCustomer/:id', auth, loggerModule.logger, customerController.deleteCustomer);
router.get('/allPurchaseHistory', auth, customerController.getAllPurchaseHistory);
router.get('/purchasesByCustomer/:id', auth, customerController.getPurchasesByCustomer);
router.get('/getAllCustomers', auth, customerController.getAllCustomers);
router.get('/getAllCustomersWithPagination', auth, customerController.getAllCustomersWithPagination);
router.get('/filterCustomers', auth, customerController.filterCustomers);
router.get('/searchNotesCustomers', auth, customerController.searchNotesCustomers); // Yeni eklenen rota


module.exports = router;
