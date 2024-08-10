const Stock = require('../models/stock');
const Customer = require('../models/customer');
const moment = require('moment-timezone');
const { filterLogs } = require('../middleware/logger.js');


// Add or update stock
exports.addStock = async (req, res) => {
  try {
    const { uniqueId, size, koliCount, packageCount, packageContain, notes } = req.body;

    const dateInTurkey = moment.tz("Europe/Istanbul").toDate();
    const total = koliCount * packageCount * packageContain;

    // Find the existing stock entry by uniqueId and size
    let stock = await Stock.findOne({ uniqueId, size });

    if (stock) {
      // Update existing stock by adding the new quantities and recalculating the total
      stock.total += total;
      stock.notes = notes; // Update notes if needed
      stock.date = dateInTurkey;
    } else {
      // Create a new stock entry if it doesn't exist
      stock = new Stock({
        uniqueId,
        size,
        total,
        notes,
        date: dateInTurkey,
        createdBy: req.user._id
      });
    }

    const savedStock = await stock.save();

    res.status(201).json({ message: 'Stock added or updated successfully', stock: savedStock });
  } catch (error) {
    console.error('Error adding or updating stock:', error);
    res.status(500).json({ message: 'Error adding or updating stock', error: error.message });
  }
};

exports.deleteStock = async (req, res) => {
  try {
    const { id } = req.params;
    const stock = await
    Stock.findByIdAndDelete(id);
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }
    res.status(200).json({ message: 'Stock deleted successfully', stock });
  }
  catch (error) {
    console.error('Error deleting stock:', error);
    res.status(500).json({ message: 'Error deleting stock', error: error.message });
  }
};


exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { uniqueId, size, total,  notes } = req.body;

    const stock = await Stock.findById(id);
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    stock.uniqueId = uniqueId;
    stock.size = size;
    stock.total = total;
    stock.notes = notes;

    const updatedStock = await stock.save();

    res.status(200).json({ message: 'Stock updated successfully', stock: updatedStock });
  }
  catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ message: 'Error updating stock', error: error.message });
  }
};

// Sell stock
exports.sellStock = async (req, res) => {
  try {
    const { uniqueId, size, koliCount, packageCount, packageContain, customerId } = req.body;

    // Find the existing stock entry by uniqueId and size
    let stock = await Stock.findOne({ uniqueId, size });

    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    // Calculate the total items requested to be sold
    const totalKoliRequested = koliCount;
    const totalPackageRequested = packageCount;
    const totalContainRequested = packageContain;
    const totalRequested = totalKoliRequested * totalPackageRequested * totalContainRequested;

    // Check if there is enough stock to sell
    if (stock.total < totalRequested) {
      return res.status(400).json({ message: 'Not enough stock to sell' });
    }

    // Decrease the stock quantities
    stock.total -= totalRequested;

    const updatedStock = await stock.save();

    // Find the customer by their ID
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Add the sold stock details to the customer's purchases
    customer.purchases.push({
      uniqueId,
      size,
      koliCount: totalKoliRequested,
      packageCount: totalPackageRequested,
      packageContain: totalContainRequested,
      date: moment.tz("Europe/Istanbul").toDate()
    });

    await customer.save();

    res.status(200).json({ message: 'Stock sold successfully', stock: updatedStock, customer });
  } catch (error) {
    console.error('Error selling stock:', error);
    res.status(500).json({ message: 'Error selling stock', error: error.message });
  }
};


// Get all stocks
exports.getAllStock = async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ date: -1 }); // Sort by date, newest first
    res.status(200).json(stocks);
  } catch (error) {
    console.error('Error getting stocks:', error);
    res.status(500).json({ message: 'Error getting stocks', error: error.message });
  }
};

// Get stocks by date
exports.byDateStock = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date query parameter is required' });
    }
    
    const startOfDay = moment.tz(date, "Europe/Istanbul").startOf('day').toDate();
    const endOfDay = moment.tz(date, "Europe/Istanbul").endOf('day').toDate();
    
    const stocks = await Stock.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ date: -1 }); // Sort by date, newest first
    
    res.status(200).json(stocks);
  } catch (error) {
    console.error('Error getting stocks by date:', error);
    res.status(500).json({ message: 'Error getting stocks by date', error: error.message });
  }
};


// Get the number of stocks added within a certain period
exports.getStocksAddedInPeriod = (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Convert dates to moment objects
    const start = moment(startDate, 'YYYY-MM-DD').startOf('day');
    const end = moment(endDate, 'YYYY-MM-DD').endOf('day');

    // Validate dates using moment
    if (!start.isValid() || !end.isValid()) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Convert to JavaScript Date objects for comparison
    const startJsDate = start.toDate();
    const endJsDate = end.toDate();

    // Filter logs for stocks added in the specified period
    const logs = filterLogs(null, null); // Modify if you need to filter by other criteria
    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return log.method === 'POST' && log.url.includes('/api/addstocks') && logDate >= startJsDate && logDate <= endJsDate;
    });

    res.status(200).json(filteredLogs);
  } catch (error) {
    console.error('Error getting stocks added in period:', error);
    res.status(500).json({ message: 'Error getting stocks added in period', error: error.message });
  }
};
