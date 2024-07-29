const mongoose = require('mongoose');
const moment = require('moment-timezone');

const stockSchema = new mongoose.Schema({
    uniqueId : {
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
    },
    notes: {
        type: String,
        reqired : false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Stock', stockSchema);
