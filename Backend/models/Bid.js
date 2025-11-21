// models/Bid.js
const mongoose = require('mongoose');

const BidSchema = new mongoose.Schema({
  helpRequestId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Request', 
    required: true 
  },
  bidderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  bidAmount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  message: { 
    type: String, 
    trim: true 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Accepted', 'Declined', 'Completed'], 
    default: 'Pending' 
  },

  totalAmount: { 
    type: Number, 
    default: function() { return this.bidAmount } 
  },
  agreedAmount: { 
    type: Number, 
    default: 0 
  },
  chatId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Chat' 
  },
}, { timestamps: true });

module.exports = mongoose.model('Bid', BidSchema);
