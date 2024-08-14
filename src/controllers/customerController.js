const Customer = require('../models/customer');
const Stock = require('../models/stock');
const Product = require('../models/product');
const moment = require('moment-timezone');
// Create a new customer
exports.createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, notes} = req.body;
    const newCustomer = new Customer({ name, email, phone, address, notes });
    const savedCustomer = await newCustomer.save();
    res.status(201).json({ message: 'Customer created successfully', customer: savedCustomer });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Error creating customer', error: error.message });
  }
};

// Get customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json(customer);
  } catch (error) {
    console.error('Error getting customer:', error);
    res.status(500).json({ message: 'Error getting customer', error: error.message });
  }
};

// Update a customer by ID
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, notes } = req.body;
    const updatedCustomer = await Customer.findByIdAndUpdate(id, { name, email, phone, address, notes}, { new: true });
    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json({ message: 'Customer updated successfully', customer: updatedCustomer });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Error updating customer', error: error.message });
  }
};

// Delete a customer by ID
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCustomer = await Customer.findByIdAndDelete(id);
    if (!deletedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Error deleting customer', error: error.message });
  }
};

// Sell stock to a customer
exports.sellStock = async (req, res) => {
  try {
    const { stockId, customerId, customerDetails } = req.body;

    const stock = await Stock.findById(stockId);
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    // Calculate the total items for this stock entry
    const totalItems = stock.koliCount * stock.packageCount * stock.packageContain;

    // Save the sold stock details in the customer model
    let customer;
    if (customerId) {
      customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
    } else {
      customer = new Customer(customerDetails);
    }

    customer.purchases.push({
      stockId: stock._id,
      size: stock.size,
      koliCount: stock.koliCount,
      packageCount: stock.packageCount,
      packageContain: stock.packageContain,
      date: moment.tz("Europe/Istanbul").toDate()
    });

    await customer.save();

    // Delete the stock
    await Stock.findByIdAndDelete(stockId);

    // Update the product entry
    let product = await Product.findOne({ size: stock.size });
    if (product) {
      product.total -= totalItems;
      if (product.total < 0) {
        product.total = 0;
      }
      await product.save();
    }

    res.status(200).json({ message: 'Stock sold successfully', customer, product });
  } catch (error) {
    console.error('Error selling stock:', error);
    res.status(500).json({ message: 'Error selling stock', error: error.message });
  }
};

// Get all purchase history
exports.getAllPurchaseHistory = async (req, res) => {
  try {
    const customers = await Customer.find().populate('purchases');
    res.status(200).json(customers);
  } catch (error) {
    console.error('Error getting purchase history:', error);
    res.status(500).json({ message: 'Error getting purchase history', error: error.message });
  }
};


exports.getPurchasesByCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await
    Customer.findById(id).populate('purchases.uniqueId');
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json(customer.purchases);
  }
  catch (error) {
    console.error('Error getting purchase history:', error);
    res.status(500).json({ message: 'Error getting purchase history', error: error.message });
  }
};

// Get all customers
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.status(200).json(customers);
  } catch (error) {
    console.error('Error getting customers:', error);
    res.status(500).json({ message: 'Error getting customers', error: error.message });
  }
};