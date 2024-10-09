const mongoose = require('mongoose');

const lastLogSchema = new mongoose.Schema({
  lastSavedTimestamp: { type: Date, required: true }
});

const LastLog = mongoose.model('LastLog', lastLogSchema);

module.exports = LastLog;
