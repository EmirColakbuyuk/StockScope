const mongoose = require('mongoose');
const moment = require('moment-timezone');

const stockSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['active', 'passive'],
        required: true
    },
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
    itemsPerBox: {
        type: Number,
        required: true
    },
    itemsPerPackage: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: () => moment().tz("Europe/Istanbul").toDate()
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
