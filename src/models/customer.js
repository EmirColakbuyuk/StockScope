const mongoose = require('mongoose');
const moment = require('moment-timezone');

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false
    },
    phone: {
        type: String,
        required: false
    },
    address: {
        type: String,
        required: false
    },
    notes: {
        type: String,
        required: false
    },
    purchases: [{
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
        },
        notes : {
            type: String,
            required: false
        }
    }],

  

}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
