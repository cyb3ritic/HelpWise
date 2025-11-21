// routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const cookieParser = require('cookie-parser');

const User = require('../models/User');
const TypeOfHelp = require('../models/TypeOfHelp'); // Model remains TypeOfHelp
const Bid = require('../models/Bid'); // Ensure Bid model is defined
const auth = require('../middleware/auth');
const nodemailer = require('nodemailer');
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
    sameSite: 'Strict',
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
    // check('expertise', 'Expertise must be an array of TypeOfHelp IDs')
    //   .isArray()
    //   .custom((arr) => arr.length >= 0)
    //   .withMessage('Select at least one expertise'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Send all validation errors
      return res.status(400).json({ errors: errors.array() });
    }

    console.log('Register Request Body:', req.body); // For debugging

    const { firstName, lastName, email, password, expertise } = req.body;

    try {
      // Check if user already exists
      let user = await User.findOne({ email });
      if (user)
        return res.status(400).json({ msg: 'User with this email already exists' });

      // Validate TypeOfHelp IDs
      // const validTypeOfHelp = await TypeOfHelp.find({ _id: { $in: expertise } });
      // if (validTypeOfHelp.length !== expertise.length) {
      //   return res.status(400).json({ msg: 'Some expertise IDs are invalid' });
      // }
      //adding

    if (!expertise || expertise.length === 0) {
  // Find a default TypeOfHelp (e.g., the first one)
  const defaultType = await TypeOfHelp.findOne();
  expertise = defaultType ? [defaultType._id] : [];
}

       const validTypeOfHelp = await TypeOfHelp.find({ _id: { $in: expertise } });
    if (validTypeOfHelp.length !== expertise.length) {
      return res.status(400).json({ msg: 'Some expertise IDs are invalid' });
    }

      // Create new user (initially not verified)
      user = new User({ firstName, lastName, email, password, expertise, isVerified: false });

      // Hash password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Generate OTP and expiry (15 minutes)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.emailOTP = otp;
      user.otpExpiresAt = Date.now() + 15 * 60 * 1000;

      await user.save();

      // Attempt to send OTP email if SMTP configured, otherwise log OTP
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
      // Send all validation errors
      return res.status(400).json({ errors: errors.array() });
    }

    console.log('Login Request Body:', req.body); // For debugging

    const { email, password } = req.body;

    try {
      // Check for user
      let user = await User.findOne({ email });
      if (!user)
        return res.status(400).json({ msg: 'Invalid Credentials' });

      // Match password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ msg: 'Invalid Credentials' });

      // Generate JWT and set cookie
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
      sameSite: 'Strict',
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
    auth, // Ensure the user is authenticated
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
      // Send all validation errors
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, expertise } = req.body;

    try {
      // Find the user by ID
      let user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Validate TypeOfHelp IDs
      const validTypeOfHelp = await TypeOfHelp.find({ _id: { $in: expertise } });
      if (validTypeOfHelp.length !== expertise.length) {
        return res.status(400).json({ msg: 'Some expertise IDs are invalid' });
      }

      // Update fields
      user.firstName = firstName;
      user.lastName = lastName;
      user.email = email;
      user.expertise = expertise;

      if (password) {
        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }

      await user.save();

      // Optionally, generate a new token if needed
      // generateToken(user, res);

      // Populate expertise before sending
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
      // Send all validation errors
      return res.status(400).json({ errors: errors.array() });
    }

    const { expertise } = req.body;

    try {
      // Validate TypeOfHelp IDs
      const validExpertise = await TypeOfHelp.find({ _id: { $in: expertise } });
      if (validExpertise.length !== expertise.length) {
        return res.status(400).json({ msg: 'Some expertise IDs are invalid' });
      }

      // Update user's expertise
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

      // Generate JWT and set cookie upon successful verification
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

module.exports = router;
