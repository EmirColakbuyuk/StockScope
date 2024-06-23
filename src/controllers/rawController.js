const RawMaterial = require('../models/raw');
const moment = require('moment-timezone');

// Add a new raw material
exports.addRawMaterial = async (req, res) => {
  try {
    const {
      supplier,
      type,
      grammage,
      totalBobinweight,
      meter,
      bobinNumber,
      bobinHeight,
      bobinDiameter,
      MasuraLength,
      date
    } = req.body;

    const dateInTurkey = date ? moment.tz(date, "Europe/Istanbul").toDate() : moment.tz("Europe/Istanbul").toDate();
    const newRawMaterial = new RawMaterial({
      supplier,
      type,
      grammage,
      totalBobinweight,
      meter,
      bobinNumber,
      bobinHeight,
      bobinDiameter,
      MasuraLength,
      date: dateInTurkey,
      createdBy: req.user._id
    });

    const savedRawMaterial = await newRawMaterial.save();
    res.status(201).json({ message: 'Raw material added successfully', rawMaterial: savedRawMaterial });
  } catch (error) {
    console.error('Error adding raw material:', error);
    res.status(500).json({ message: 'Error adding raw material', error: error.message });
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
    res.status(200).json({ message: 'Raw material deleted successfully' });
  } catch (error) {
    console.error('Error deleting raw material:', error);
    res.status(500).json({ message: 'Error deleting raw material', error: error.message });
  }
};

// Update a raw material by ID
exports.updateRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      supplier,
      type,
      grammage,
      totalBobinweight,
      meter,
      bobinNumber,
      bobinHeight,
      bobinDiameter,
      MasuraLength,
      date
    } = req.body;

    const dateInTurkey = date ? moment.tz(date, "Europe/Istanbul").toDate() : moment.tz("Europe/Istanbul").toDate();
    const updatedRawMaterial = await RawMaterial.findByIdAndUpdate(
      id,
      {
        supplier,
        type,
        grammage,
        totalBobinweight,
        meter,
        bobinNumber,
        bobinHeight,
        bobinDiameter,
        MasuraLength,
        date: dateInTurkey,
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

// Get all raw materials
exports.getAllRawMaterials = async (req, res) => {
  try {
    const rawMaterials = await RawMaterial.find();
    res.status(200).json(rawMaterials);
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
    const rawMaterials = await RawMaterial.find({ date: dateInTurkey });
    res.status(200).json(rawMaterials);
  } catch (error) {
    console.error('Error getting raw materials by date:', error);
    res.status(500).json({ message: 'Error getting raw materials by date', error: error.message });
  }
};
