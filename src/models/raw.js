const mongoose = require('mongoose');
const moment = require('moment-timezone');

const rawSchema = new mongoose.Schema({
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
    totalBobinweight: {
        type: Number,
        required: true
    },
    meter: {
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
    MasuraLength: {
        type: Number,
        required: true
    },
   
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Raw Material', rawSchema);
