// routes/gemini.js

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

// Initialize Google Gemini AI with API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * @route   POST /api/gemini/generate-risks
 * @desc    Generate risks and prevention measures for a help request using Google Gemini
 * @access  Private
 */
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
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description } = req.body;

    try {
      // Get the Gemini model
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Prepare the enhanced prompt for Gemini
      const prompt = `Analyze the following help request and provide a concise, structured risk assessment.

**Help Request Title:** ${title}
**Description:** ${description}

**Instructions:**
- Identify 3-5 key risks associated with responding to this help request
- For each risk, provide 1-2 specific prevention measures
- Use clear, concise bullet points
- Keep the total response under 300 words
- Format using Markdown with headers and bullets

**Format your response as:**

## Risk Assessment

### Risk 1: [Risk Name]
- **Prevention:** [Prevention measure 1]
- **Prevention:** [Prevention measure 2]

### Risk 2: [Risk Name]
- **Prevention:** [Prevention measure]

[Continue for remaining risks]`

;

      // Generate content using Gemini
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const risksAndPreventions = response.text();

      // Log successful generation (optional)
      console.log(`✅ Risk analysis generated for: "${title}"`);

      res.json({ risksAndPreventions });
    } catch (err) {
      console.error('Gemini API Error:', err.message || err);

      // Handle specific Gemini API errors
      if (err.message?.includes('API key')) {
        return res.status(401).json({ 
          msg: 'Invalid or missing Gemini API key. Please check your configuration.' 
        });
      }

      if (err.message?.includes('quota')) {
        return res.status(429).json({ 
          msg: 'API quota exceeded. Please try again later.' 
        });
      }

      // Generic error response
      res.status(500).json({ 
        msg: 'Failed to generate risks and prevention measures. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
);

/**
 * @route   POST /api/gemini/chat
 * @desc    General purpose chat endpoint using Gemini (optional enhancement)
 * @access  Private
 */
router.post(
  '/chat',
  [
    auth,
    [
      check('message', 'Message is required').not().isEmpty(),
      check('message', 'Message must be at least 3 characters').isLength({ min: 3 }),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message, context } = req.body;

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Build prompt with optional context
      let prompt = message;
      if (context) {
        prompt = `Context: ${context}\n\nUser Question: ${message}`;
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      res.json({ response: text });
    } catch (err) {
      console.error('Gemini Chat Error:', err.message || err);
      res.status(500).json({ 
        msg: 'Failed to process chat message.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/gemini/test
 * @desc    Test Gemini API connection
 * @access  Private
 */
router.get('/test', auth, async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Say "Gemini API is working!"');
    const response = await result.response;
    const text = response.text();

    res.json({ 
      status: 'success', 
      message: 'Gemini API is configured correctly',
      testResponse: text 
    });
  } catch (err) {
    console.error('Gemini Test Error:', err.message || err);
    res.status(500).json({ 
      status: 'error',
      message: 'Gemini API connection failed',
      error: err.message 
    });
  }
});

module.exports = router;
