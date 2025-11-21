// routes/typeOfHelp.js
const express = require('express');
const router = express.Router();
const TypeOfHelp = require('../models/TypeOfHelp');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// @route   GET /api/type-of-help
// @desc    Get all types of help
// @access  Public
router.get('/', async (req, res) => {
  console.log("Fetching types of help");
  try {
    const types = await TypeOfHelp.find().sort({ name: 1 });
    res.json(types);
    // const types = await TypeOfHelp.find();
    // res.json(types);
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Optional: Admin routes to add, update, delete types
// Implement with proper authentication and authorization

module.exports = router;
