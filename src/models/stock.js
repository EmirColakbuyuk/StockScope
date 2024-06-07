const mongoose = require('mongoose');


const stockSchema = new mongoose.Schema({

    type : {
        type: String,
        required: true
    },
    weight : {
        type: Number,
        required: true
    },
    date : {
        type: Date,
        required: true
    },
    price : {
        type: Number,
        required: true
    },
    

});

module.exports = mongoose.model('Stock', stockSchema);
    