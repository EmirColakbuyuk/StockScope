const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const auth = require('../middleware/auth');

// Supplier routes
router.post('/addSupplier', auth, supplierController.addSupplier); // Add a new supplier
router.put('/updateSupplier/:id', auth, supplierController.updateSupplier); // Update a supplier by ID
router.delete('/deleteSupplier/:id', auth, supplierController.deleteSupplier); // Delete a supplier by ID
router.get('/getAllSuppliers', auth, supplierController.getAllSuppliers); // Get all suppliers
router.get('/getAllSuppliersPaginated', auth, supplierController.getAllSuppliersPaginated);
router.get('/getSupplier/:id', auth, supplierController.getSupplierById); // Get a supplier by
router.get('/getPurchasesBySupplier', auth, supplierController.getPurchasesBySupplier); // Get purchases by supplier


module.exports = router;