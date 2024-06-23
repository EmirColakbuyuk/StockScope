const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    size: {
        type: String,
        required: true,
        unique: true
    },
    total: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
