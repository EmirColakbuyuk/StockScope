const Customer = require('../models/customer');
const Stock = require('../models/stock');

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


// Functions

// Get all customers alphabetically without pagination
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 }); // 1 is for ascending order (A-Z)
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
        .sort({ name: 1 }) // 1 is for ascending order (A-Z)
        .skip((page - 1) * limit)
        .limit(limit);

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

//
// // Filter customers by name, email, phone, address, and optionally by creation date
// exports.filterCustomers = async (req, res) => {
//   try {
//     const { name, email, phone, address, sortOrder, page = 1, limit = 5 } = req.query;
//
//     let query = {};
//
//     // Name filter
//     if (name) {
//       query.name = { $regex: new RegExp(`^${name}$`, 'i') }; // Exact match first
//     }
//
//     // Email filter
//     if (email) {
//       query.email = { $regex: new RegExp(`^${email}$`, 'i') }; // Exact match first
//     }
//
//     // Phone filter
//     if (phone) {
//       query.phone = { $regex: new RegExp(`^${phone}$`, 'i') }; // Exact match first
//     }
//
//     // Address filter
//     if (address) {
//       query.address = { $regex: new RegExp(`^${address}$`, 'i') }; // Exact match first
//     }
//
//     // Sort order for creation date
//     let sort = {};
//     if (sortOrder === 'asc') {
//       sort.createdAt = 1; // Oldest to newest
//     } else if (sortOrder === 'desc') {
//       sort.createdAt = -1; // Newest to oldest
//     }
//
//     // If no exact matches are found, search for similar entries
//     const customers = await Customer.find(query)
//         .sort(sort)
//         .skip((page - 1) * limit)
//         .limit(limit);
//
//     const count = await Customer.countDocuments(query);
//
//     // If no exact matches are found, search for similar entries
//     if (customers.length === 0) {
//       const similarQuery = {};
//
//       if (name) {
//         similarQuery.name = { $regex: new RegExp(name, 'i') }; // Partial match
//       }
//
//       if (email) {
//         similarQuery.email = { $regex: new RegExp(email, 'i') }; // Partial match
//       }
//
//       if (phone) {
//         similarQuery.phone = { $regex: new RegExp(phone, 'i') }; // Partial match
//       }
//
//       if (address) {
//         similarQuery.address = { $regex: new RegExp(address, 'i') }; // Partial match
//       }
//
//       const similarCustomers = await Customer.find(similarQuery)
//           .sort(sort)
//           .skip((page - 1) * limit)
//           .limit(limit);
//
//       const similarCount = await Customer.countDocuments(similarQuery);
//
//       return res.status(200).json({
//         customers: similarCustomers,
//         totalPages: Math.ceil(similarCount / limit),
//         currentPage: Number(page),
//         totalItems: similarCount,
//       });
//     }
//
//     res.status(200).json({
//       customers,
//       totalPages: Math.ceil(count / limit),
//       currentPage: Number(page),
//       totalItems: count,
//     });
//   } catch (error) {
//     console.error('Error filtering customers:', error);
//     res.status(500).json({ message: 'Error filtering customers', error: error.message });
//   }
// };
exports.filterCustomers = async (req, res) => {
  try {
    const { name, email, phone, address, sortOrder, page = 1, limit = 5 } = req.query;

    let query = {};

    // Log the incoming query parameters for debugging
    console.log('Received filters:', req.query);

    // Name filter
    if (name) {
      query.name = { $regex: new RegExp(`^${name}$`, 'i') }; // Exact match first
    }

    // Email filter
    if (email) {
      query.email = { $regex: new RegExp(`^${email}$`, 'i') }; // Exact match first
    }

    // Phone filter
    if (phone) {
      query.phone = { $regex: new RegExp(`^${phone}$`, 'i') }; // Exact match first
    }

    // Address filter
    if (address) {
      query.address = { $regex: new RegExp(`^${address}$`, 'i') }; // Exact match first
    }

    // Sort order for creation date
    let sort = {};
    if (sortOrder === 'asc') {
      sort.createdAt = 1; // Oldest to newest
    } else if (sortOrder === 'desc') {
      sort.createdAt = -1; // Newest to oldest
    }

    // Log the constructed query and sort order
    console.log('Query:', query);
    console.log('Sort order:', sort);

    const customers = await Customer.find(query)
        .sort(sort)  // Ensure that this is sorting by 'createdAt'
        .skip((page - 1) * limit)
        .limit(limit);

    const count = await Customer.countDocuments(query);

    // Log the retrieved customers and count
    console.log('Retrieved customers:', customers.map(c => ({ id: c._id, createdAt: c.createdAt })));  // Log only the necessary fields
    console.log('Total count:', count);
    console.log('Final MongoDB query:', query);
    console.log('Sort Order:', sort);
    console.log('Retrieved Data:', customers.map(c => ({ id: c._id, createdAt: c.createdAt })));


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



// // Search customers by notes

exports.searchNotesCustomers = async (req, res) => {
  try {
    const { searchQuery, page = 1, limit = 5 } = req.query;

    // console.log('Received searchQuery:', searchQuery); // Log the received searchQuery

    let searchCriteria = {};
    if (searchQuery) {
      searchCriteria.notes = { $regex: searchQuery, $options: 'i' }; // Case-insensitive partial match
    }

    // console.log('Constructed searchCriteria:', searchCriteria); // Log the constructed searchCriteria

    const customers = await Customer.find(searchCriteria)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

    // console.log('Found customers:', customers); // Log the found customers

    const count = await Customer.countDocuments(searchCriteria);

    res.status(200).json({
      customers,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalItems: count,
    });
  } catch (error) {
    // console.error('Error searching customers by notes:', error);
    res.status(500).json({ message: 'Error searching customers by notes', error: error.message });
  }
};
