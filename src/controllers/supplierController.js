const Supplier = require('../models/supplier');
const moment = require('moment-timezone');

// Add a new supplier
exports.addSupplier = async (req, res) => {
  try {
    const { name, code, address, notes } = req.body;

    // Create new supplier
    const newSupplier = new Supplier({
      name,
      code,
      address,
      notes
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
    const { name, code, address, notes } = req.body;

    // Find supplier by ID and update
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      { name, code, address, notes },
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

// Get all suppliers
exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.status(200).json(suppliers);
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
