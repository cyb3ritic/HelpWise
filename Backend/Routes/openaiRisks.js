// routes/openaiRisks.js
const express = require('express');
const { OpenAI } = require('openai');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

// Initialize OpenAI with API Key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// @route   POST /api/openai/generate-risks
// @desc    Generate risks and prevention measures for a help request using OpenAI
// @access  Private
router.post(
  '/generate-risks',
  [
    auth, // Ensure the user is authenticated
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('description', 'Description must be at least 10 characters').isLength({ min: 10 }),
    ],
  ],
  async (req, res) => {
    // Validate incoming request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return all validation errors
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description } = req.body;

    try {
      // Prepare the prompt for OpenAI
      const prompt = `
      Analyze the following help request and provide a list of potential risks along with corresponding prevention measures.

      **Help Request Title:** ${title}
      **Description:** ${description}

      **Risks and Prevention Measures:**
      `;

      // Call OpenAI's API using the latest method
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Adjust to your preferred model (e.g., 'gpt-4' or 'gpt-3.5-turbo')
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      // Extract the generated content
      const risksAndPreventions = completion.choices[0].message.content.trim();

      res.json({ risksAndPreventions });
    } catch (err) {
      console.error('OpenAI API Error:', err.message || err.response?.data);
      res.status(500).json({ msg: 'Failed to generate risks and prevention measures. Please try again later.' });
    }
  }
);

module.exports = router;
