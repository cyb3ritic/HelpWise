// models/Request.js
const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  typeOfHelp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TypeOfHelp',
    required: true,
  },
  offeredAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bid',
    },
  ],
  responseDeadline: {
    type: Date,
    required: true,
  },
  workDeadline: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Completed', 'Closed'],
    default: 'Open',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Request', RequestSchema);
