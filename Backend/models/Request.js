// models/Request.js
const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
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
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: false,
      },
      coordinates: {
        type: [Number],
        required: false,
      },
    },
    
    // ⭐ MISSING FIELDS - ADD THESE:
    acceptedBidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bid',
    },
    acceptedBidderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    completedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
    descriptionEmbedding: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: true, // ⭐ This automatically adds createdAt and updatedAt
  }
);

// Index for better query performance
RequestSchema.index({ requesterId: 1, status: 1 });
RequestSchema.index({ status: 1, createdAt: -1 });
RequestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Request', RequestSchema);
