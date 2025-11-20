// routes/chatbot.js

const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai'); // Ensure this is the correct import based on your SDK version
const auth = require('../middleware/auth'); // Middleware to ensure the user is authenticated

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * @route   POST /api/chatbot
 * @desc    Handle chatbot messages
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ msg: 'Message is required.' });
  }

  try {
    // Define the system prompt to guide the chatbot's behavior
    const systemPrompt = `You are a helpful assistant designed to provide information about the Help Platform website. Answer user questions clearly and concisely to help them understand how to use the website.`;

    // Create the message payload
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Use 'gpt-3.5-turbo' if 'gpt-4' is unavailable
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 500, // Adjust based on your needs
      temperature: 0.7, // Adjust for response creativity
    });

    // Ensure the response structure matches the SDK's response
    const aiMessage = completion.choices[0].message.content.trim();

    res.json({ message: aiMessage });
  } catch (err) {
    console.error('Error in chatbot route:', err.message || err.response?.data);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
