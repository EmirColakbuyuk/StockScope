const mongoose = require('mongoose');
const moment = require('moment-timezone');

const stockSchema = new mongoose.Schema({

    type : {
        type: String,
        required: true
    },

    koli: {
        type:Number
    },

    ton : {
        type: Number,
        required: true
    },

    lengthMeters : {
        type: Number,
        required: true
    },

    grammage : {
        type: Number,
        required: true
    },
   
    company : {
        type: String,
        required: true
    },
    
    date: {
        type: Date,
        required: true,
        default: () => moment().tz("Europe/Istanbul").toDate()
    },

});

module.exports = mongoose.model('Stock', stockSchema);
    