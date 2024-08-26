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
router.get('/stocks-added-in-period', auth,  stockController.getStocksAddedInPeriod);
router.get('/allStockPaginated', auth, stockController.getAllStocksPaginated); // Get all stocks with pagination
router.get('/allStockActivePaginated', auth, stockController.getActiveStocksPaginated); // Get only active stocks with pagination
router.get('/allStockPassivePaginated', auth, stockController.getPassiveStocksPaginated); // Get only passive stocks with pagination
router.get('/searchNotesAllStocks', auth, stockController.searchNotesAllStocks); // Search all stocks by notes
router.get('/searchNotesActiveStocks', auth, stockController.searchNotesActiveStocks); // Search active stocks by notes
router.get('/searchNotesPassiveStocks', auth, stockController.searchNotesPassiveStocks); // Search passive stocks by notes
router.get('/filterStocks', auth, stockController.filterStocks); // Filter all stocks
router.get('/filterActiveStocks', auth, stockController.filterActiveStocks); // Filter active stocks
router.get('/filterPassiveStocks', auth, stockController.filterPassiveStocks); // Filter passive stocks


module.exports = router;
