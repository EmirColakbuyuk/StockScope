const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const auth = require('../middleware/auth');

// Stock routes
router.post('/stocks',auth , stockController.addStock); // Add a new stock
router.delete('/stocks/:id',auth , stockController.deleteStock); // Delete a stock by ID
router.put('/stocks/:id',auth , stockController.updateStock); // Update a stock by ID
router.get('/allStocks',auth , stockController.getAllStock); // Get all stocks
router.get('/stocks/by-date',auth , stockController.byDateStock); // Get stocks by date

module.exports = router;
