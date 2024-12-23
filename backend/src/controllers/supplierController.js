const Supplier = require('../models/supplier');
const RawMaterial = require('../models/raw');
const moment = require('moment-timezone');

// Add a new supplier
exports.addSupplier = async (req, res) => {
  try {
    console.log('Gelen veriler:', req.body);
    const { name, code, contactPerson, address, notes, phone } = req.body;


    // Create new supplier
    const newSupplier = new Supplier({
      name,
      code,
      contactPerson,
      address,
      notes,
      phone,
    });

    // Save to database
    const savedSupplier = await newSupplier.save();
    res.status(201).json({ message: 'Supplier added successfully', supplier: savedSupplier });
  } catch (error) {
    console.error('Error adding supplier:', error);
    res.status(500).json({ message: 'Error adding supplier', error: error.message });
  }
};

// Update a supplier by ID
exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, address, notes, phone, contactPerson } = req.body; 

    console.log("Request received to update supplier");
    console.log(`Supplier ID: ${id}`);

    // Find supplier by ID and update
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      { name, code, address, notes, phone, contactPerson }, 
      { new: true }
    );

    if (!updatedSupplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.status(200).json({ message: 'Supplier updated successfully', supplier: updatedSupplier });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ message: 'Error updating supplier', error: error.message });
  }
};

// Delete a supplier by ID
exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSupplier = await Supplier.findByIdAndDelete(id);

    if (!deletedSupplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.status(200).json({ message: 'Supplier deleted successfully', supplier: deletedSupplier });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ message: 'Error deleting supplier', error: error.message });
  }
};

// Get all suppliers for infinite scroll (with alphabetic sorting)
exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 }).exec();
    res.status(200).json(suppliers);
  } catch (error) {
    console.error('Error getting suppliers:', error);
    res.status(500).json({ message: 'Error getting suppliers', error: error.message });
  }
};

// Get paginated suppliers (with alphabetic sorting)
exports.getAllSuppliersPaginated = async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const suppliers = await Supplier.find()
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Supplier.countDocuments();

    res.status(200).json({
      suppliers,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalItems: count
    });
  } catch (error) {
    console.error('Error getting suppliers:', error);
    res.status(500).json({ message: 'Error getting suppliers', error: error.message });
  }
};

// Get a supplier by ID
exports.getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.status(200).json(supplier);
  } catch (error) {
    console.error('Error getting supplier:', error);
    res.status(500).json({ message: 'Error getting supplier', error: error.message });
  }
};

// Get purchases by supplier
exports.getPurchasesBySupplier = async (req, res) => {
  try {
    const { supplier } = req.body;
    const rawMaterials = await RawMaterial.find({ supplier });
    if (!rawMaterials.length) {
      return res.status(404).json({ message: 'No raw materials found for this supplier.' });
    }
    res.status(200).json(rawMaterials);
  } catch (error) {
    console.error('Error fetching raw materials by supplier:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get filtered and paginated suppliers
exports.filterSuppliers = async (req, res) => {
  try {
    const {
      name,
      code,
      address,
      phone,
      contactPerson, 
      startDate,
      endDate,
      sortOrder,
      page = 1,
      limit = 5,
    } = req.query;

    let query = {};

    if (name) query.name = { $regex: name, $options: 'i' };
    if (code) query.code = { $regex: code, $options: 'i' };
    if (address) query.address = { $regex: address, $options: 'i' };
    if (phone) query.phone = { $regex: phone, $options: 'i' };
    if (contactPerson) query.contactPerson = { $regex: contactPerson, $options: 'i' }; 

    if (startDate && endDate) {
      query.createdAt = {
        $gte: moment(startDate).startOf('day').toDate(),
        $lte: moment(endDate).endOf('day').toDate()
      };
    } else if (startDate) {
      query.createdAt = { $gte: moment(startDate).startOf('day').toDate() };
    } else if (endDate) {
      query.createdAt = { $lte: moment(endDate).endOf('day').toDate() };
    }

    let sort = {};
    if (sortOrder === 'asc') {
      sort.createdAt = 1;
    } else if (sortOrder === 'desc') {
      sort.createdAt = -1;
    } else if (!startDate && !endDate) {
      sort.name = 1;
    }

    const suppliers = await Supplier.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Supplier.countDocuments(query);

    res.status(200).json({
      suppliers,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalItems: count,
    });
  } catch (error) {
    console.error('Error getting filtered suppliers:', error);
    res.status(500).json({ message: 'Error getting filtered suppliers', error: error.message });
  }
};

// Search suppliers by notes
exports.searchNotesSuppliers = async (req, res) => {
  try {
    const { searchQuery, page = 1, limit = 5 } = req.query;

    if (!searchQuery) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    let searchCriteria = {
      notes: { $regex: searchQuery, $options: 'i' }
    };

    const totalItems = await Supplier.countDocuments(searchCriteria);

    const suppliers = await Supplier.find(searchCriteria)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    res.status(200).json({
      suppliers,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: Number(page),
      totalItems
    });
  } catch (error) {
    console.error('Error searching suppliers:', error);
    res.status(500).json({ message: 'Error searching suppliers', error: error.message });
  }
};

// Analyze supplier
exports.analyzeSupplier = async (req, res) => {
  try {
    const { supplier, filterPeriod, startDate, endDate } = req.query;

    if (!supplier) {
      return res.status(400).json({ message: 'Supplier is required' });
    }

    let matchCriteria = { supplier };

    if (filterPeriod) {
      const now = new Date();
      let startDateFilter;

      switch (filterPeriod) {
        case 'daily':
          startDateFilter = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'weekly':
          startDateFilter = new Date(now.setDate(now.getDate() - 7));
          startDateFilter.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          startDateFilter = new Date(now.setMonth(now.getMonth() - 1));
          startDateFilter.setHours(0, 0, 0, 0);
          break;
        case '6months':
          startDateFilter = new Date(now.setMonth(now.getMonth() - 6));
          startDateFilter.setHours(0, 0, 0, 0);
          break;
        case 'yearly':
          startDateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
          startDateFilter.setHours(0, 0, 0, 0);
          break;
        default:
          return res.status(400).json({ message: 'Invalid filter period' });
      }

      matchCriteria.createdAt = { $gte: startDateFilter };
    }

    if (startDate || endDate) {
      matchCriteria.createdAt = matchCriteria.createdAt || {};
      if (startDate) matchCriteria.createdAt.$gte = new Date(startDate);
      if (endDate) matchCriteria.createdAt.$lte = new Date(endDate);
    }

    const results = await RawMaterial.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: {
            name: "$name",
            type: "$type"
          },
          grammage: { $sum: "$grammage" },
          totalBobinweight: { $sum: "$totalBobinweight" }
        }
      },
      {
        $project: {
          _id: 0,
          name: "$_id.name",
          type: "$_id.type",
          grammage: 1,
          totalBobinweight: 1
        }
      }
    ]);

    if (results.length > 0) {
      res.status(200).json(results);
    } else {
      res.status(404).json({ message: 'No data found for the given criteria' });
    }
  } catch (error) {
    console.error('Error analyzing supplier:', error);
    res.status(500).json({ message: 'Error analyzing supplier', error: error.message });
  }
};

// Analyze all suppliers distribution
exports.analyzeSuppliersDistribution = async (req, res) => {
  try {
    const { filterPeriod, startDate, endDate } = req.query;

    let matchCriteria = {};

    if (filterPeriod) {
      const now = new Date();
      let startDateFilter;

      switch (filterPeriod) {
        case 'daily':
          startDateFilter = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'weekly':
          startDateFilter = new Date(now.setDate(now.getDate() - 7));
          startDateFilter.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          startDateFilter = new Date(now.setMonth(now.getMonth() - 1));
          startDateFilter.setHours(0, 0, 0, 0);
          break;
        case '6months':
          startDateFilter = new Date(now.setMonth(now.getMonth() - 6));
          startDateFilter.setHours(0, 0, 0, 0);
          break;
        case 'yearly':
          startDateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
          startDateFilter.setHours(0, 0, 0, 0);
          break;
        default:
          return res.status(400).json({ message: 'Invalid filter period' });
      }

      matchCriteria.createdAt = { $gte: startDateFilter };
    }

    if (startDate || endDate) {
      matchCriteria.createdAt = matchCriteria.createdAt || {};
      if (startDate) matchCriteria.createdAt.$gte = new Date(startDate);
      if (endDate) matchCriteria.createdAt.$lte = new Date(endDate);
    }

    const results = await RawMaterial.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: {
            supplier: "$supplier",
            name: "$name",
            type: "$type"
          },
          grammage: { $sum: "$grammage" },
          totalBobinweight: { $sum: "$totalBobinweight" }
        }
      },
      {
        $group: {
          _id: "$_id.supplier",
          materials: {
            $push: {
              name: "$_id.name",
              type: "$_id.type",
              grammage: "$grammage",
              totalBobinweight: "$totalBobinweight"
            }
          },
          totalGrammage: { $sum: "$grammage" },
          totalBobinweight: { $sum: "$totalBobinweight" }
        }
      },
      {
        $project: {
          _id: 0,
          supplier: "$_id",
          materials: 1,
          totalGrammage: 1,
          totalBobinweight: 1
        }
      }
    ]);

    res.status(200).json(results.length > 0 ? results : []);
  } catch (error) {
    console.error('Error analyzing all suppliers:', error);
    res.status(500).json({ message: 'Error analyzing all suppliers', error: error.message });
  }
};
