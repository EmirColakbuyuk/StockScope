const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const auth = require('../middleware/auth');
const roleAccess = require('../middleware/roleAccess');
const loggerModule = require('../middleware/logger');

// Supplier routes
router.post('/addSupplier', auth, loggerModule.logger, supplierController.addSupplier); // Add a new supplier
router.put('/updateSupplier/:id', auth, loggerModule.logger, supplierController.updateSupplier); // Update a supplier by ID
router.delete('/deleteSupplier/:id', auth, loggerModule.logger, supplierController.deleteSupplier); // Delete a supplier by ID
router.get('/getAllSuppliers', auth, supplierController.getAllSuppliers); // Get all suppliers
router.get('/getAllSuppliersPaginated', auth, supplierController.getAllSuppliersPaginated);
router.get('/getSupplier/:id', auth, supplierController.getSupplierById); // Get a supplier by
router.get('/getPurchasesBySupplier', auth, supplierController.getPurchasesBySupplier); // Get purchases by supplier
router.get('/filterSuppliers', auth, supplierController.filterSuppliers);
router.get('/searchNotesSuppliers', auth, supplierController.searchNotesSuppliers);
router.get('/supplierAnalysis', auth, supplierController.analyzeSupplier); 
router.get('/supplierDistribution', auth, supplierController.analyzeSuppliersDistribution);

module.exports = router;