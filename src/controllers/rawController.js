const RawMaterial = require('../models/raw');
const Supplier = require('../models/supplier');
const moment = require('moment-timezone');

exports.addRawMaterial = async (req, res) => {
  try {
    const {
      name,
      supplier: supplierCode, // Supplier code
      type,
      grammage,
      totalBobinweight,
      meter,
      bobinNumber,
      bobinHeight,
      bobinDiameter,
      MasuraLength,
      notes
    } = req.body;

    // Check if supplier exists
    const supplierDoc = await Supplier.findOne({ code: supplierCode });
    if (!supplierDoc) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    // Create new raw material
    const newRawMaterial = new RawMaterial({
      name,
      supplier: supplierCode, // Save supplier code
      type,
      grammage,
      totalBobinweight,
      meter,
      bobinNumber,
      bobinHeight,
      bobinDiameter,
      MasuraLength,
      notes,
      createdBy: req.user ? req.user._id : null
    });

    // Save to database
    const savedRawMaterial = await newRawMaterial.save();
    res.status(201).json({ message: 'Raw material added successfully', rawMaterial: savedRawMaterial });
  } catch (error) {
    console.error('Error adding raw material:', error);
    res.status(500).json({ message: 'Error adding raw material', error: error.message });
  }
};


exports.updateRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      supplier: supplierCode, // Supplier code
      type,
      grammage,
      totalBobinweight,
      meter,
      bobinNumber,
      bobinHeight,
      bobinDiameter,
      MasuraLength,
      notes,
      date
    } = req.body;

    // Find supplier by code
    const supplierDoc = await Supplier.findOne({ code: supplierCode });
    if (!supplierDoc) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const dateInTurkey = date ? moment.tz(date, "Europe/Istanbul").toDate() : moment.tz("Europe/Istanbul").toDate();
    const updatedRawMaterial = await RawMaterial.findByIdAndUpdate(
      id,
      {
        name,
        supplier: supplierCode, // Update supplier code
        type,
        grammage,
        totalBobinweight,
        meter,
        bobinNumber,
        bobinHeight,
        bobinDiameter,
        MasuraLength,
        notes,
        createdAt: dateInTurkey,
        updatedBy: req.user._id
      },
      { new: true }
    );

    if (!updatedRawMaterial) {
      return res.status(404).json({ message: 'Raw material not found' });
    }

    res.status(200).json({ message: 'Raw material updated successfully', rawMaterial: updatedRawMaterial });
  } catch (error) {
    console.error('Error updating raw material:', error);
    res.status(500).json({ message: 'Error updating raw material', error: error.message });
  }
};



// Delete a raw material by ID
exports.deleteRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRawMaterial = await RawMaterial.findByIdAndDelete(id);

    if (!deletedRawMaterial) {
      return res.status(404).json({ message: 'Raw material not found' });
    }
    return res.status(200).json({ message: 'Raw material deleted successfully', rawMaterial: deletedRawMaterial });
  } catch (error) {
    console.error('Error deleting raw material:', error);
    res.status(500).json({ message: 'Error deleting raw material', error: error.message });
  }
};

// Soft delete a raw material by ID (change status to 'passive')
exports.softDeleteRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedRawMaterial = await RawMaterial.findByIdAndUpdate(
      id,
      { status: 'passive' },
      { new: true }
    );

    if (!updatedRawMaterial) {
      return res.status(404).json({ message: 'Raw material not found' });
    }

    res.status(200).json({ message: 'Raw material status updated to passive', rawMaterial: updatedRawMaterial });
  } catch (error) {
    console.error('Error updating raw material status:', error);
    res.status(500).json({ message: 'Error updating raw material status', error: error.message });
  }
};

// Get all raw materials
exports.getAllRawMaterials = async (req, res) => {
  try {
    const rawMaterials = await RawMaterial.find().populate({
      path: 'supplier',
      select: 'code'
    }).populate({
      path: 'type',
      select: 'name'
    });
    res.status(200).json(rawMaterials);
  } catch (error) {
    console.error('Error getting raw materials:', error);
    res.status(500).json({ message: 'Error getting raw materials', error: error.message });
  }
};

// Get all active raw materials
exports.getAllActiveRawMaterials = async (req, res) => {
  try {
    const rawMaterials = await RawMaterial.find({ status: 'active' }).populate({
      path: 'supplier',
      select: 'code'
    }).populate({
      path: 'type',
      select: 'name'
    });
    res.status(200).json(rawMaterials);
  } catch (error) {
    console.error('Error getting active raw materials:', error);
    res.status(500).json({ message: 'Error getting active raw materials', error: error.message });
  }
};

// Get all passive raw materials
exports.getAllPassiveRawMaterials = async (req, res) => {
  try {
    const rawMaterials = await RawMaterial.find({ status: 'passive' }).populate({
      path: 'supplier',
      select: 'code'
    }).populate({
      path: 'type',
      select: 'name'
    });
    res.status(200).json(rawMaterials);
  } catch (error) {
    console.error('Error getting passive raw materials:', error);
    res.status(500).json({ message: 'Error getting passive raw materials', error: error.message });
  }
};

// Get all raw materials with pagination
exports.getAllRawMaterialPagination = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const rawMaterials = await RawMaterial.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate({
        path: 'supplier',
        select: 'code'
      })
      .exec();

    const count = await RawMaterial.countDocuments();

    res.status(200).json({
      rawMaterials,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalItems: count
    });
  } catch (error) {
    console.error('Error getting raw materials:', error);
    res.status(500).json({ message: 'Error getting raw materials', error: error.message });
  }
};

// Get raw materials by date
exports.getRawMaterialsByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const dateInTurkey = moment.tz(date, "Europe/Istanbul").startOf('day').toDate();
    const rawMaterials = await RawMaterial.find({ createdAt: dateInTurkey }).populate({
      path: 'supplier',
      select: 'code'
    }).populate({
      path: 'type',
      select: 'name'
    });
    res.status(200).json(rawMaterials);
  } catch (error) {
    console.error('Error getting raw materials by date:', error);
    res.status(500).json({ message: 'Error getting raw materials by date', error: error.message });
  }
};

// Get distinct values by name
exports.getDistinctValuesByName = async (req, res) => {
  try {
    const { name } = req.params;

    // Fields to get distinct values for
    const fields = [
      'type',
      'supplier',
      'grammage',
      'totalBobinweight',
      'meter',
      'bobinNumber',
      'bobinHeight',
      'bobinDiameter',
      'MasuraLength'
    ];

    // Object to hold distinct values for each field
    const distinctValues = {};

    for (const field of fields) {
      distinctValues[field] = await RawMaterial.find({ name }).distinct(field);
    }

    res.status(200).json(distinctValues);
  } catch (error) {
    console.error('Error getting distinct values by name:', error);
    res.status(500).json({ message: 'Error getting distinct values by name', error: error.message });
  }
};

// Get all active raw materials with pagination
exports.getAllActiveRawMaterialPagination = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const rawMaterials = await RawMaterial.find({ status: 'active' })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate({
        path: 'supplier',
        select: 'code'
      })
      .exec();

    const count = await RawMaterial.countDocuments({ status: 'active' });

    res.status(200).json({
      rawMaterials,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalItems: count
    });
  } catch (error) {
    console.error('Error getting raw materials:', error);
    res.status(500).json({ message: 'Error getting raw materials', error: error.message });
  }
};

// Get all distinct names
exports.getAllNames = async (req, res) => {
  try {
    const names = await RawMaterial.find().distinct('name');
    res.status(200).json(names);
  } catch (error) {
    console.error('Error getting names:', error);
    res.status(500).json({ message: 'Error getting names', error: error.message });
  }
};
