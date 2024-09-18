const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const auth = require('../middleware/auth');

// Stock routes
router.post('/addStocks',auth , stockController.addStock); // Add a new stock
router.delete('/deleteStock/:id',auth , stockController.deleteStock); // Delete a stock by ID
router.delete('/deleteStockFromCustomers', auth, stockController.deleteStockFromCustomer); // Delete all stocks from a customer
router.put('/updateStock/:id',auth , stockController.updateStock); // Update a stock by ID
router.get('/getAllActiveStocks',auth , stockController.getAllActiveStock); // Get all active stocks
router.get('/getAllPassiveStocks',auth , stockController.getAllPassiveStock); // Get all passive stocks
router.get('/getAllStocks',auth , stockController.getAllStocks); 
router.post('/sellStock', auth, stockController.sellStock); // Sell stock
router.get('/stocks-added-in-period', auth,  stockController.getStocksAddedInPeriod);
router.get('/stocks/distinct/:field', auth, stockController.getDistinctValuesByField); // Get distinct values by name  
router.get('/stock/getAllSizes', auth, stockController.getAllSizes); // Get all sizes
router.get('/stock/getWeightBySize/:size', auth, stockController.getDistinctWeightsBySize); // Get distinct values by field

router.get('/allStockPaginated', auth, stockController.getPaginatedAllStocks); // Get all stocks with pagination
router.get('/allStockActivePaginated', auth, stockController.getPaginatedActiveStock); // Get only active stocks with pagination
router.get('/allStockPassivePaginated', auth, stockController.getPaginatedPassiveStock); // Get only passive stocks with pagination
router.get('/searchNotesAllStocks', auth, stockController.searchNotesAllStocks); // Search all stocks by notes
router.get('/searchNotesActiveStocks', auth, stockController.searchNotesActiveStocks); // Search active stocks by notes
router.get('/searchNotesPassiveStocks', auth, stockController.searchNotesPassiveStocks); // Search passive stocks by notes
router.get('/filterStocks', auth, stockController.filterAllStocks); // Filter all stocks
router.get('/filterActiveStocks', auth, stockController.filterActiveStocks); // Filter active stocks
router.get('/filterPassiveStocks', auth, stockController.filterPassiveStocks); // Filter passive stocks



module.exports = router;
