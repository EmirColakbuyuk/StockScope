const mongoose = require('mongoose');

const rawSchema = new mongoose.Schema({
    status: {
        type: String,
        required: true,
        default: 'active',
        enum: ['active', 'passive', 'dummy']
    },
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
    totalBobinweight: {
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
    notes: {
        type: String,
        required: false
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
    },
    soldAt: {
        type: Date, 
        required: false
    },
    soldNote: {
        type: String,
        required: false
    },
    customer: {
        type: String,
        required: false,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('RawMaterial', rawSchema);