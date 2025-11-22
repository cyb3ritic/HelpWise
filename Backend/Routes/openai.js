const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const TypeOfHelp = require('../models/TypeOfHelp'); // Added TypeOfHelp model import
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
      // Fetch all available categories
      const categories = await TypeOfHelp.find({}, 'name description _id');
      const categoriesList = categories
        .map((c) => `- ${c.name} (ID: ${c._id}): ${c.description || ''}`)
        .join('\n');

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `
        You are an intelligent assistant for a help request platform.
        
        Task 1: Enhance the following help request description to be clear, detailed, professional, and compelling.
        Task 2: Select the most appropriate category ID from the provided list that best matches the description.

        User Description: "${description}"

        Available Categories:
        ${categoriesList}

        Output Format:
        Provide the response in strictly valid JSON format with no additional text or markdown formatting:
        {
          "enhancedDescription": "The enhanced description text...",
          "suggestedCategoryId": "The exact ID of the best matching category"
        }
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();

      // Clean up the response if it contains markdown code blocks
      const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

      const parsedResponse = JSON.parse(jsonString);

      res.json({
        enhancedDescription: parsedResponse.enhancedDescription,
        suggestedCategoryId: parsedResponse.suggestedCategoryId
      });
    } catch (err) {
      console.error('Gemini API Error:', err.message || err);
      console.error('Full error details:', err);
      res.status(500).json({ msg: 'Failed to enhance description. Please try again later.', error: err.message });
    }
  }
);

module.exports = router;