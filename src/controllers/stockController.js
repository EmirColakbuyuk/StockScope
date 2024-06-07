const Stock = require('../models/stock');

// Add a new stock
exports.addStock = async (req, res) => {
  try {
    const { type, weight, date, price } = req.body;
    const newStock = new Stock({ type, weight, date, price });
    const savedStock = await newStock.save();
    res.status(201).json({ message: 'Stock added successfully', stock: savedStock });
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(500).json({ message: 'Error adding stock', error: error.message });
  }
};

// Delete a stock by ID
exports.deleteStock = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStock = await Stock.findByIdAndDelete(id);
    if (!deletedStock) {
      return res.status(404).json({ message: 'Stock not found' });
    }
    res.status(200).json({ message: 'Stock deleted successfully' });
  } catch (error) {
    console.error('Error deleting stock:', error);
    res.status(500).json({ message: 'Error deleting stock', error: error.message });
  }
};

// Update a stock by ID
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, weight, date, price } = req.body;
    const updatedStock = await Stock.findByIdAndUpdate(id, { type, weight, date, price }, { new: true });
    if (!updatedStock) {
      return res.status(404).json({ message: 'Stock not found' });
    }
    res.status(200).json({ message: 'Stock updated successfully', stock: updatedStock });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ message: 'Error updating stock', error: error.message });
  }
};

// Get all stocks
exports.getAllStock = async (req, res) => {
  try {
    const stocks = await Stock.find();
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
    const stocks = await Stock.find({ date: new Date(date) });
    res.status(200).json(stocks);
  } catch (error) {
    console.error('Error getting stocks by date:', error);
    res.status(500).json({ message: 'Error getting stocks by date', error: error.message });
  }
};
