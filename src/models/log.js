const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  method: { type: String, required: true },
  url: { type: String, required: true },
  user: { type: String, required: true },
  objectId: { type: String, default: null },
  objectType: { type: String, default: null },
  requestBody: { type: Object, default: {} },
  responseBody: { type: String, default: '' },
});

module.exports = mongoose.model('Log', logSchema);
