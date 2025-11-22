// routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const User = require('../models/User');
const TypeOfHelp = require('../models/TypeOfHelp');
const Bid = require('../models/Bid');
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();

// Middleware to parse cookies
router.use(cookieParser());

// Utility function to generate JWT and set cookie
const generateToken = (user, res) => {
  const payload = { user: { id: user.id } };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Set JWT in HTTP-only cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Set to true in production
    sameSite: 'Lax',
    maxAge: 3600000, // 1 hour
  });
};

// @route   POST /api/users/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    check('firstName', 'First name is required').not().isEmpty(),
    check('firstName', 'First name must contain only alphabets').isAlpha(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('lastName', 'Last name must contain only alphabets').isAlpha(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters long').isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    console.log('Register Request Body:', req.body);

    const { firstName, lastName, email, password, expertise } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user)
        return res.status(400).json({ msg: 'User with this email already exists' });

      let expertiseIds = [];
      if (!expertise || expertise.length === 0) {
        const defaultType = await TypeOfHelp.findOne();
        expertiseIds = defaultType ? [defaultType._id] : [];
      } else {
        expertiseIds = expertise;
      }

      const validTypeOfHelp = await TypeOfHelp.find({ _id: { $in: expertiseIds } });
      if (validTypeOfHelp.length !== expertiseIds.length) {
        return res.status(400).json({ msg: 'Some expertise IDs are invalid' });
      }

      user = new User({ firstName, lastName, email, password, expertise: expertiseIds, isVerified: false });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.emailOTP = otp;
      user.otpExpiresAt = Date.now() + 15 * 60 * 1000;

      await user.save();

      try {
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          const mailOptions = {
            from: process.env.FROM_EMAIL || process.env.SMTP_USER,
            to: user.email,
            subject: 'HelpWise - Email verification code',
            text: `Your HelpWise verification code is ${otp}. It expires in 15 minutes.`,
          };

          await transporter.sendMail(mailOptions);
        } else {
          console.log(`OTP for ${user.email}: ${otp} (SMTP not configured)`);
        }
      } catch (emailErr) {
        console.error('Error sending OTP email:', emailErr.message);
      }

      res.json({ msg: 'OTP sent to email for verification', email: user.email });
    } catch (err) {
      console.error('Register Error:', err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST /api/users/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    console.log('Login Request Body:', req.body);

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (!user)
        return res.status(400).json({ msg: 'Invalid Credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ msg: 'Invalid Credentials' });

      generateToken(user, res);

      res.json({ msg: 'Logged in successfully' });
    } catch (err) {
      console.error('Login Error:', err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST /api/users/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });
    res.json({ msg: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout Error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/users/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('expertise', 'name description');
    res.json(user);
  } catch (err) {
    console.error('Get Current User Error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/users/me
// @desc    Update current user's profile
// @access  Private
router.put(
  '/me',
  [
    auth,
    [
      check('firstName', 'First name is required').not().isEmpty(),
      check('firstName', 'First name must contain only letters and spaces').matches(/^[a-zA-Z\s]+$/),
      check('lastName', 'Last name is required').not().isEmpty(),
      check('lastName', 'Last name must contain only letters and spaces').matches(/^[a-zA-Z\s]+$/),
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Password must be at least 6 characters long').optional().isLength({ min: 6 }),
      check('expertise', 'Expertise must be an array of TypeOfHelp IDs')
        .isArray()
        .custom((arr) => arr.length > 0)
        .withMessage('Select at least one expertise'),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, expertise } = req.body;

    try {
      let user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const validTypeOfHelp = await TypeOfHelp.find({ _id: { $in: expertise } });
      if (validTypeOfHelp.length !== expertise.length) {
        return res.status(400).json({ msg: 'Some expertise IDs are invalid' });
      }

      user.firstName = firstName;
      user.lastName = lastName;
      user.email = email;
      user.expertise = expertise;

      if (password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }

      await user.save();

      user = await User.findById(user.id).select('-password').populate('expertise', 'name description');

      res.json(user);
    } catch (err) {
      console.error('Update Profile Error:', err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT /api/users/update-expertise
// @desc    Update user expertise
// @access  Private
router.put(
  '/update-expertise',
  [
    auth,
    [
      check('expertise', 'Expertise must be an array of TypeOfHelp IDs')
        .isArray()
        .custom((arr) => arr.length > 0)
        .withMessage('Select at least one expertise'),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { expertise } = req.body;

    try {
      const validExpertise = await TypeOfHelp.find({ _id: { $in: expertise } });
      if (validExpertise.length !== expertise.length) {
        return res.status(400).json({ msg: 'Some expertise IDs are invalid' });
      }

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { expertise },
        { new: true }
      ).populate('expertise', 'name description');

      res.json(user);
    } catch (err) {
      console.error('Update Expertise Error:', err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET /api/users/me/bids
// @desc    Get user's placed bids
// @access  Private
router.get('/me/bids', auth, async (req, res) => {
  try {
    const bids = await Bid.find({ bidderId: req.user.id })
      .populate('helpRequestId', 'title typeOfHelp')
      .sort({ createdAt: -1 });
    res.json(bids);
  } catch (err) {
    console.error('Get User Bids Error:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/users/verify-otp
// @desc    Verify user's email using OTP
// @access  Public
router.post(
  '/verify-otp',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('otp', 'OTP must be provided').isLength({ min: 6, max: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ msg: 'User not found' });

      if (user.isVerified) return res.status(400).json({ msg: 'User already verified' });

      if (!user.emailOTP || !user.otpExpiresAt) {
        return res.status(400).json({ msg: 'No OTP found for this user' });
      }

      if (Date.now() > new Date(user.otpExpiresAt).getTime()) {
        return res.status(400).json({ msg: 'OTP has expired' });
      }

      if (user.emailOTP !== otp) {
        return res.status(400).json({ msg: 'Invalid OTP' });
      }

      user.isVerified = true;
      user.emailOTP = undefined;
      user.otpExpiresAt = undefined;
      await user.save();

      generateToken(user, res);

      res.json({ msg: 'Email verified successfully' });
    } catch (err) {
      console.error('Verify OTP Error:', err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST /api/users/resend-otp
// @desc    Resend OTP to user's email
// @access  Public
router.post('/resend-otp', [check('email', 'Please include a valid email').isEmail()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User not found' });

    if (user.isVerified) return res.status(400).json({ msg: 'User already verified' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailOTP = otp;
    user.otpExpiresAt = Date.now() + 15 * 60 * 1000;
    await user.save();

    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const mailOptions = {
          from: process.env.FROM_EMAIL || process.env.SMTP_USER,
          to: user.email,
          subject: 'HelpWise - Your new verification code',
          text: `Your new verification code is ${otp}. It expires in 15 minutes.`,
        };

        await transporter.sendMail(mailOptions);
      } else {
        console.log(`Resent OTP for ${user.email}: ${otp} (SMTP not configured)`);
      }
    } catch (emailErr) {
      console.error('Error resending OTP email:', emailErr.message);
    }

    res.json({ msg: 'OTP resent to email' });
  } catch (err) {
    console.error('Resend OTP Error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/users/enhance-profile
// @desc    Enhance user profile from Twitter/GitHub with profile pictures
// @access  Private
router.post('/enhance-profile', auth, async (req, res) => {
  try {
    const { twitterUsername, githubUrl } = req.body;
    const userId = req.user.id;

    console.log('Enhancement request:', { twitterUsername, githubUrl, userId });

    let enhancedData = {
      github: null,
      twitter: null,
      lastUpdated: new Date(),
    };

    let profilePicture = null;
    let profilePictureSource = null;

    // ========== GITHUB DATA EXTRACTION ==========
    if (githubUrl) {
      const username = githubUrl.split('github.com/')[1]?.split('/')[0]?.trim();
      
      if (username) {
        try {
          console.log(`Fetching GitHub data for: ${username}`);

          const githubUserRes = await axios.get(`https://api.github.com/users/${username}`, {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'HelpWise-Platform',
            }
          });

          const githubReposRes = await axios.get(
            `https://api.github.com/users/${username}/repos?sort=updated&per_page=30`,
            {
              headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'HelpWise-Platform',
              }
            }
          );

          const languages = new Set();
          const topSkills = new Set();

          githubReposRes.data.forEach(repo => {
            if (repo.language) {
              languages.add(repo.language);
              topSkills.add(repo.language);
            }
            if (repo.topics && repo.topics.length > 0) {
              repo.topics.forEach(topic => topSkills.add(topic));
            }
          });

          const topRepos = githubReposRes.data
            .sort((a, b) => b.stargazers_count - a.stargazers_count)
            .slice(0, 10)
            .map(repo => ({
              name: repo.name,
              description: repo.description || 'No description',
              language: repo.language,
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              url: repo.html_url,
              topics: repo.topics || [],
            }));

          enhancedData.github = {
            username: githubUserRes.data.login,
            bio: githubUserRes.data.bio || '',
            company: githubUserRes.data.company || '',
            location: githubUserRes.data.location || '',
            blog: githubUserRes.data.blog || '',
            followers: githubUserRes.data.followers || 0,
            following: githubUserRes.data.following || 0,
            publicRepos: githubUserRes.data.public_repos || 0,
            createdAt: githubUserRes.data.created_at,
            updatedAt: githubUserRes.data.updated_at,
            avatarUrl: githubUserRes.data.avatar_url, // ← SAVE AVATAR URL
            repositories: topRepos,
            languages: Array.from(languages),
            topSkills: Array.from(topSkills).slice(0, 15),
          };

          // Set profile picture from GitHub
          if (!profilePicture) {
            profilePicture = githubUserRes.data.avatar_url;
            profilePictureSource = 'github';
          }

          console.log(`✅ GitHub data fetched successfully for ${username}`);

        } catch (error) {
          console.error('GitHub fetch error:', error.response?.data || error.message);
          return res.status(400).json({ 
            msg: 'Failed to fetch GitHub data. Please check the URL and try again.',
            error: error.response?.data?.message || error.message
          });
        }
      } else {
        return res.status(400).json({ msg: 'Invalid GitHub URL format' });
      }
    }

    // ========== TWITTER DATA EXTRACTION ==========
    if (twitterUsername) {
      try {
        const cleanUsername = twitterUsername.replace('@', '').trim();
        console.log(`Fetching Twitter data for: ${cleanUsername}`);

        if (process.env.TWITTER_BEARER_TOKEN) {
          const twitterRes = await axios.get(
            `https://api.twitter.com/2/users/by/username/${cleanUsername}`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
              },
              params: {
                'user.fields': 'created_at,description,location,name,profile_image_url,public_metrics,url,verified,username'
              }
            }
          );

          const userData = twitterRes.data.data;

          enhancedData.twitter = {
            username: userData.username,
            name: userData.name,
            description: userData.description || '',
            location: userData.location || '',
            website: userData.url || '',
            followersCount: userData.public_metrics?.followers_count || 0,
            followingCount: userData.public_metrics?.following_count || 0,
            tweetCount: userData.public_metrics?.tweet_count || 0,
            verified: userData.verified || false,
            profileImageUrl: userData.profile_image_url || '', // ← SAVE PROFILE IMAGE URL
            createdAt: userData.created_at,
          };

          // Set profile picture from Twitter (prefer higher resolution)
          if (!profilePicture || profilePictureSource === 'twitter') {
            // Replace _normal with _400x400 for higher resolution
            const highResImage = userData.profile_image_url?.replace('_normal', '_400x400');
            profilePicture = highResImage;
            profilePictureSource = 'twitter';
          }

          console.log(`✅ Twitter data fetched successfully for @${cleanUsername}`);
        } else {
          enhancedData.twitter = {
            username: cleanUsername,
            message: 'Limited data available. Add TWITTER_BEARER_TOKEN to .env for full profile enhancement.',
          };
          console.log('⚠️ Twitter Bearer Token not configured');
        }

      } catch (error) {
        console.error('Twitter fetch error:', error.response?.data || error.message);
        
        enhancedData.twitter = {
          username: twitterUsername.replace('@', ''),
          error: 'Failed to fetch Twitter data. Please verify username.',
        };
      }
    }

    // ========== FALLBACK TO GRAVATAR ==========
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // If no profile picture from GitHub/Twitter, use Gravatar
    if (!profilePicture && user.email) {
      const emailHash = crypto.createHash('md5')
        .update(user.email.toLowerCase().trim())
        .digest('hex');
      profilePicture = `https://www.gravatar.com/avatar/${emailHash}?s=400&d=identicon`;
      profilePictureSource = 'gravatar';
    }

    // ========== UPDATE USER PROFILE ==========
    if (twitterUsername) user.twitterUsername = twitterUsername.replace('@', '');
    if (githubUrl) user.githubUrl = githubUrl;
    user.enhancedProfile = enhancedData;
    
    // ← SAVE PROFILE PICTURE AND SOURCE
    if (profilePicture) {
      user.profilePicture = profilePicture;
      user.profilePictureSource = profilePictureSource;
    }

    // Update bio and location from GitHub or Twitter
    if (enhancedData.github) {
      if (!user.bio && enhancedData.github.bio) {
        user.bio = enhancedData.github.bio;
      }
      if (!user.location && enhancedData.github.location) {
        user.location = enhancedData.github.location;
      }
      if (!user.website && enhancedData.github.blog) {
        user.website = enhancedData.github.blog;
      }
    }

    if (enhancedData.twitter && !enhancedData.twitter.error) {
      if (!user.bio && enhancedData.twitter.description) {
        user.bio = enhancedData.twitter.description;
      }
      if (!user.location && enhancedData.twitter.location) {
        user.location = enhancedData.twitter.location;
      }
      if (!user.website && enhancedData.twitter.website) {
        user.website = enhancedData.twitter.website;
      }
    }

    await user.save();

    console.log('✅ Profile enhanced successfully');

    res.json({ 
      msg: 'Profile enhanced successfully', 
      data: {
        bio: user.bio,
        location: user.location,
        website: user.website,
        profilePicture: user.profilePicture, // ← RETURN PROFILE PICTURE
        profilePictureSource: user.profilePictureSource,
        githubData: enhancedData.github ? {
          repos: enhancedData.github.publicRepos,
          followers: enhancedData.github.followers,
          languages: enhancedData.github.languages.length,
        } : null,
        twitterData: enhancedData.twitter && !enhancedData.twitter.error ? {
          followers: enhancedData.twitter.followersCount,
          tweets: enhancedData.twitter.tweetCount,
          verified: enhancedData.twitter.verified,
        } : null,
      }
    });

  } catch (error) {
    console.error('Profile enhancement error:', error);
    res.status(500).json({ 
      msg: 'Server error during profile enhancement',
      error: error.message 
    });
  }
});

module.exports = router;
