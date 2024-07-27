const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const auth = require('../middleware/auth');

// Stock routes
router.post('/addstocks',auth , stockController.addStock); // Add a new stock
router.delete('/deleteStock/:id',auth , stockController.deleteStock); // Delete a stock by ID
router.put('/updateStock/:id',auth , stockController.updateStock); // Update a stock by ID
router.get('/getallStocks',auth , stockController.getAllStock); // Get all stocks
router.get('/stocks/by-date',auth , stockController.byDateStock); // Get stocks by date
router.post('/sellStock', auth, stockController.sellStock); // Sell stock

module.exports = router;
