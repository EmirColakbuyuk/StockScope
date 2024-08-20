const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true },
    address: { type: String, required: false },
    phone: { type: String, required: false },
    notes: { type: String , required: false}
    },
    { timestamps: true });


module.exports = mongoose.model('Supplier', supplierSchema);