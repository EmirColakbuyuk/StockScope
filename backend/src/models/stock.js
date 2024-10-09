const mongoose = require('mongoose');
const moment = require('moment-timezone');

const stockSchema = new mongoose.Schema({
    size: {
        type: String,
        required: true
    },
    weight: {
        type: Number,
        required: true
    },
    boxCount: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: false,
        default: null
    },
    notes: {
        type: String,
        required: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Stock', stockSchema);
