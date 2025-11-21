const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  emailOTP: { type: String },
  otpExpiresAt: { type: Date },
  credibilityPoints: { type: Number, default: 0 },
  expertise: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TypeOfHelp' }],
  reviews: [
    {
      reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
    },
  ],
  stripeConnectedAccountId: { type: String }, // For Stripe Connect
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
