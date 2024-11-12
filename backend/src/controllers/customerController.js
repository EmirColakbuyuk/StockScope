const Customer = require('../models/customer');
const Stock = require('../models/stock');
const moment = require('moment-timezone');

// Create a new customer
exports.createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address, notes, contactPerson, shippingCompany } = req.body;
    const newCustomer = new Customer({ name, email, phone, address, notes, contactPerson, shippingCompany });
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
    const { name, email, phone, address, notes, contactPerson, shippingCompany } = req.body;
    
    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { name, email, phone, address, notes, contactPerson, shippingCompany },
      { new: true }
    );

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

// Get purchases by customer ID
exports.getPurchasesByCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id).populate('purchases.uniqueId');
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json(customer.purchases);
  } catch (error) {
    console.error('Error getting purchase history:', error);
    res.status(500).json({ message: 'Error getting purchase history', error: error.message });
  }
};

// Get all customers alphabetically without pagination
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.status(200).json(customers);
  } catch (error) {
    console.error('Error getting customers:', error);
    res.status(500).json({ message: 'Error getting customers', error: error.message });
  }
};

// Get all customers with pagination and alphabetical order
exports.getAllCustomersWithPagination = async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;

    const customers = await Customer.find()
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const count = await Customer.countDocuments();

    res.status(200).json({
      customers,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalItems: count,
    });
  } catch (error) {
    console.error('Error getting customers with pagination:', error);
    res.status(500).json({ message: 'Error getting customers with pagination', error: error.message });
  }
};

// Filter customers based on various fields
exports.filterCustomers = async (req, res) => {
  try {
    const { name, email, phone, address, contactPerson, shippingCompany, sortOrder, page = 1, limit = 5 } = req.query;

    let query = {};

    console.log('Received filters:', req.query);

    if (name) query.name = { $regex: new RegExp(name, 'i') };
    if (email) query.email = { $regex: new RegExp(email, 'i') };
    if (phone) query.phone = { $regex: new RegExp(phone, 'i') };
    if (address) query.address = { $regex: new RegExp(address, 'i') };
    if (contactPerson) query.contactPerson = { $regex: new RegExp(contactPerson, 'i') };
    if (shippingCompany) query.shippingCompany = { $regex: new RegExp(shippingCompany, 'i') };

    let sort = {};
    if (sortOrder === 'asc') {
      sort.createdAt = 1;
    } else if (sortOrder === 'desc') {
      sort.createdAt = -1;
    }

    const customers = await Customer.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const count = await Customer.countDocuments(query);

    console.log('Retrieved customers:', customers.map(c => ({ id: c._id, createdAt: c.createdAt })));
    res.status(200).json({
      customers,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalItems: count,
    });
  } catch (error) {
    console.error('Error filtering customers:', error);
    res.status(500).json({ message: 'Error filtering customers', error: error.message });
  }
};

// Search customers by notes
exports.searchNotesCustomers = async (req, res) => {
  try {
    const { searchQuery, page = 1, limit = 5 } = req.query;

    let searchCriteria = {};
    if (searchQuery) {
      searchCriteria.notes = { $regex: searchQuery, $options: 'i' };
    }

    const customers = await Customer.find(searchCriteria)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const count = await Customer.countDocuments(searchCriteria);

    res.status(200).json({
      customers,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalItems: count,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error searching customers by notes', error: error.message });
  }
};
