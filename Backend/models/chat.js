// models/Chat.js
const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,  // One chat document per user
    index: true
  },
  messages: [
    {
      sender: {
        type: String,
        enum: ['user', 'bot'],
        required: true
      },
      text: {
        type: String,
        required: true,
        maxlength: 5000
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      metadata: {
        type: mongoose.Schema.Types.Mixed, // For quick replies, actions, etc.
        default: null
      }
    }
  ],
  sessionState: {
    intent: { type: String, default: null },
    step: { type: String, default: null },
    slots: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  messageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true  // createdAt and updatedAt
});

// Indexes
ChatSchema.index({ user: 1, lastActivity: -1 });

// Pre-save middleware
ChatSchema.pre('save', function (next) {
  if (this.isModified('messages')) {
    this.messageCount = this.messages.length;
    this.lastActivity = new Date();
  }
  next();
});

// Method to add messages
ChatSchema.methods.addMessages = function (userMessage, botMessage, metadata = null) {
  this.messages.push({
    sender: 'user',
    text: userMessage,
    timestamp: new Date()
  });

  this.messages.push({
    sender: 'bot',
    text: botMessage,
    timestamp: new Date(),
    metadata: metadata
  });

  // Keep last 200 messages to prevent document bloat
  if (this.messages.length > 200) {
    this.messages = this.messages.slice(-200);
  }

  this.lastActivity = new Date();
  this.messageCount = this.messages.length;

  return this.save();
};

module.exports = mongoose.model('Chat', ChatSchema);