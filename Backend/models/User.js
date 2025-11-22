// models/User.js

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
  stripeConnectedAccountId: { type: String },
  
  // ========== ADD THESE NEW FIELDS ==========
  twitterUsername: { 
    type: String, 
    trim: true,
  },
  githubUrl: { 
    type: String, 
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^https?:\/\/(www\.)?github\.com\/.+/.test(v);
      },
      message: 'Invalid GitHub URL format'
    }
  },
  bio: {
    type: String,
    maxlength: 500,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  website: {
    type: String,
    trim: true,
  },
  profilePicture: {
    type: String,
    default: null,
  },
  profilePictureSource: {
    type: String,
    enum: ['github', 'twitter', 'gravatar', 'manual', null],
    default: null,
  },
  enhancedProfile: {
    github: {
      username: String,
      bio: String,
      company: String,
      location: String,
      blog: String,
      followers: Number,
      following: Number,
      publicRepos: Number,
      createdAt: Date,
      updatedAt: Date,
      avatarUrl: String, // ← Profile picture URL
      repositories: [{
        name: String,
        description: String,
        language: String,
        stars: Number,
        forks: Number,
        url: String,
        topics: [String],
      }],
      languages: [String],
      topSkills: [String],
    },
    twitter: {
      username: String,
      name: String,
      description: String,
      location: String,
      website: String,
      followersCount: Number,
      followingCount: Number,
      tweetCount: Number,
      verified: Boolean,
      profileImageUrl: String, // ← Profile picture URL
      createdAt: Date,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    }
  },
  // ===========================================
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
