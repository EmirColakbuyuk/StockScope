const mongoose = require('mongoose');
const moment = require('moment-timezone');

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        required: false
    },
    purchases: [{
        stockId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Stock',
            required: true
        },
        uniqueId: {
            type: String,
            required: true
        },
        size: {
            type: String,
            required: true
        },
        koliCount: {
            type: Number,
            required: true
        },
        packageCount: {
            type: Number,
            required: true
        },
        packageContain: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            required: true,
            default: () => moment().tz("Europe/Istanbul").toDate()
        }
    }],

  

}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
