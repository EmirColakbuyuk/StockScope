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
    contactPerson: {
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
    shippingCompany: {
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
        notes: {
            type: String,
            required: false
        },
        soldNote: {
            type: String,
            required: false
        }
    }],
    purchasesRaw: [{  
        name: {
            type: String,
            required: true
        },
        supplier: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        grammage: {
            type: Number,
            required: true
        },
        meter: {
            type: Number,
            required: true
        },
        bobinWeight: {
            type: Number,
            required: true
        },
        bobinNumber: {
            type: Number,
            required: true
        },
        bobinHeight: {
            type: Number,
            required: true
        },
        bobinDiameter: {
            type: Number,
            required: true
        },
        SquareMeter: {
            type: Number,
            required: true
        },
        totalBobinweight: {
            type: Number,
            required: true
        },
        notes: {
            type: String,
            required: false
        },
        soldNote: {
            type: String,
            required: false
        },
        date: {
            type: Date,
            required: true,
            default: () => moment().tz("Europe/Istanbul").toDate()
        }
    }]

}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
