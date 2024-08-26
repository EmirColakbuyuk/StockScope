const Supplier = require('../models/supplier');
const RawMaterial = require('../models/raw');
const moment = require('moment-timezone');

// Add a new supplier
exports.addSupplier = async (req, res) => {
  try {
    const { name, code, address, notes, phone } = req.body; // Include phone

    // Create new supplier
    const newSupplier = new Supplier({
      name,
      code,
      address,
      notes,
      phone // Add phone
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
    const { name, code, address, notes, phone } = req.body; // Include phone

    // Find supplier by ID and update
    const updatedSupplier = await Supplier.findByIdAndUpdate(
        id,
        { name, code, address, notes, phone }, // Include phone
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
        .sort({ name: 1 }) // Alphabetical sorting by name
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



exports.getPurchasesBySupplier = async (req, res) => {
  try {
    const { supplier } = req.body;
    const rawMaterials = await RawMaterial.find({ supplier: supplier });
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
      startDate, // Belirli bir tarihten sonra eklenenler için
      endDate,   // Belirli bir tarihten önce eklenenler için
      sortOrder, // Tarihe göre sıralama (asc, desc)
      page = 1,
      limit = 5,
    } = req.query;

    // MongoDB query object
    let query = {};

    // Name filter
    if (name) {
      query.name = { $regex: name, $options: 'i' }; // Case-insensitive partial match
    }

    // Code filter
    if (code) {
      query.code = { $regex: code, $options: 'i' };
    }

    // Address filter
    if (address) {
      query.address = { $regex: address, $options: 'i' };
    }

    // Phone filter
    if (phone) {
      query.phone = { $regex: phone, $options: 'i' };
    }

    // Date filter: after startDate, before endDate
    if (startDate && endDate) {
      query.createdAt = { $gte: moment(startDate).startOf('day').toDate(), $lte: moment(endDate).endOf('day').toDate() };
    } else if (startDate) {
      query.createdAt = { $gte: moment(startDate).startOf('day').toDate() };
    } else if (endDate) {
      query.createdAt = { $lte: moment(endDate).endOf('day').toDate() };
    }

    // Sort order
    let sort = {};

    if (sortOrder === 'asc') {
      sort.createdAt = 1; // Oldest to newest
    } else if (sortOrder === 'desc') {
      sort.createdAt = -1; // Newest to oldest
    } else if (!startDate && !endDate) {
      // If no date filter is applied, default sorting by name alphabetically
      sort.name = 1; // Alphabetical order by name
    }

    // Fetch filtered and paginated suppliers
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


// Search suppliers by notes only with pagination
exports.searchNotesSuppliers = async (req, res) => {
  try {
    const { query, page = 1, limit = 5 } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Arama sorgusu gereklidir' });
    }

    // MongoDB query object: Sadece notlar içinde arama yapacak
    let searchQuery = {
      notes: { $regex: query, $options: 'i' } // Notlar içinde geçen herhangi bir eşleşme (case-insensitive)
    };

    // Pagination için toplam sonuç sayısını alıyoruz
    const totalItems = await Supplier.countDocuments(searchQuery);

    // Sadece belirli sayıda sonuç döndürmek için limit ve skip kullanıyoruz
    const suppliers = await Supplier.find(searchQuery)
        .limit(limit * 1) // limit'i integer olarak kullan
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