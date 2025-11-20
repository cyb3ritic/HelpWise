const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

// Initialize Gemini with API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @route   POST /api/openai/enhance-description
// @desc    Enhance help request description using Gemini
// @access  Private
router.post(
  '/enhance-description',
  [
    auth,
    [
      check('description', 'Description is required').not().isEmpty(),
      check('description', 'Description must be at least 10 characters').isLength({ min: 10 }),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description } = req.body;

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `Please enhance the following help request description to make it clear, detailed, professional, and compelling. Keep it concise but informative:\n\n"${description}"\n\nProvide only the enhanced description without any additional commentary.`;

      const result = await model.generateContent(prompt);
      const enhancedDescription = result.response.text().trim();

      res.json({ enhancedDescription });
    } catch (err) {
      console.error('Gemini API Error:', err.message || err);
      console.error('Full error details:', err);
      res.status(500).json({ msg: 'Failed to enhance description. Please try again later.', error: err.message });
    }
  }
);

module.exports = router;