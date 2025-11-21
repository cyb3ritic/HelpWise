// models/TypeOfHelp.js
const mongoose = require('mongoose');

const TypeOfHelpSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('TypeOfHelp', TypeOfHelpSchema);
