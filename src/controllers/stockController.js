const Stock = require('../models/stock');
const Product = require('../models/product');
const Customer = require('../models/customer');
const moment = require('moment-timezone');

// Add a new stock
exports.addStock = async (req, res) => {
  try {
    const {
      uniqueId,
      size,
      koliCount,
      packageCount,
      packageContain,
      notes
    } = req.body;

    const dateInTurkey = moment.tz("Europe/Istanbul").toDate();
    const newStock = new Stock({
      uniqueId,
      size,
      koliCount,
      packageCount,
      packageContain,
      notes,
      date: dateInTurkey,
      createdBy: req.user._id
    });

    const savedStock = await newStock.save();

    // Calculate the total items for this stock entry
    const totalItems = koliCount * packageCount * packageContain;

    // Update or create the product entry
    let product = await Product.findOne({ size });
    if (product) {
      product.total += totalItems;
    } else {
      product = new Product({
        uniqueId,
        size,
        total: totalItems
      });
    }

    await product.save();

    res.status(201).json({ message: 'Stock added successfully', stock: savedStock, product });
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

    // Calculate the total items for this stock entry
    const totalItems = deletedStock.koliCount * deletedStock.packageCount * deletedStock.packageContain;

    // Update the product entry
    let product = await Product.findOne({ size: deletedStock.uniqueId });
    if (product) {
      product.total -= totalItems;
      if (product.total < 0) {
        product.total = 0;
      }
      await product.save();
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
    const {
      uniqueId ,
      size,
      koliCount,
      packageCount,
      packageContain,
      date,
      notes
    } = req.body;

    const dateInTurkey = date ? moment.tz(date, "Europe/Istanbul").toDate() : moment.tz("Europe/Istanbul").toDate();
    const existingStock = await Stock.findById(id);

    if (!existingStock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    // Calculate the total items for the old stock entry
    const oldTotalItems = existingStock.koliCount * existingStock.packageCount * existingStock.packageContain;

    // Calculate the total items for the new stock entry
    const newTotalItems = koliCount * packageCount * packageContain;

    const updatedStock = await Stock.findByIdAndUpdate(
     id,
      {
        uniqueId,
        size,
        koliCount,
        packageCount,
        packageContain,
        notes,
        date: dateInTurkey,
        createdBy: existingStock.createdBy
      },
      { new: true }
    );

    if (!updatedStock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    // Update the product entry
    let product = await Product.findOne({ uniqueId });
    if (product) {
      product.total = product.total - oldTotalItems + newTotalItems;
      await product.save();
    }

    res.status(200).json({ message: 'Stock updated successfully', stock: updatedStock });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status500.json({ message: 'Error updating stock', error: error.message });
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
    const dateInTurkey = moment.tz(date, "Europe/Istanbul").startOf('day').toDate();
    const stocks = await Stock.find({ date: dateInTurkey });
    res.status(200).json(stocks);
  } catch (error) {
    console.error('Error getting stocks by date:', error);
    res.status(500).json({ message: 'Error getting stocks by date', error: error.message });
  }
};


// Sell a  product
exports.sellProduct = async (req, res) => {
  try {
    const { uniqueId, customerId, koliCount, packageCount, packageContain } = req.body;

    // Find the product by its ID
    const product = await Product.findOne({uniqueId});
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find the customer by their ID
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Calculate the total items to be sold
    const totalItems = koliCount * packageCount * packageContain;

    // Check if there is enough stock to sell
    if (product.total < totalItems) {
      return res.status(400).json({ message: 'Not enough stock to sell' });
    }

    // Add the sold stock details to the customer's purchases
    customer.purchases.push({
      productId: product._id,
      uniqueId: product.uniqueId,
      size: product.size,
      koliCount: koliCount,
      packageCount: packageCount,
      packageContain: packageContain,
      date: moment.tz("Europe/Istanbul").toDate()
    });

    await customer.save();

    // Update the product entry
    product.total -= totalItems;
    await product.save();

    res.status(200).json({ message: 'Stock sold successfully', customer, product });
  } catch (error) {
    console.error('Error selling stock:', error);
    res.status(500).json({ message: 'Error selling stock', error: error.message });
  }
};