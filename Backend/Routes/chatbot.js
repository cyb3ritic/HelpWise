// routes/chatbot.js
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const jwt = require('jsonwebtoken');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model configuration
const MODEL_CONFIG = {
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.9,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  },
};

// System prompt
const SYSTEM_PROMPT = `You are a helpful and friendly assistant for the Help Platform website. 

CRITICAL INSTRUCTIONS:
- You have FULL ACCESS to the complete conversation history
- Always read through the ENTIRE conversation before responding
- Reference previous messages when relevant to show you remember
- If user asks about something they mentioned before, recall it accurately
- Maintain consistent context throughout the conversation
- Be conversational and acknowledge you remember previous interactions

Your role:
- Answer questions about the platform's features
- Guide users on how to use the website
- Provide clear, accurate information based on conversation history
- Be polite, professional, and context-aware

Always provide responses that show you understand the full context of the conversation.`;

/**
 * Safely extract user ID from token
 */
const getUserFromToken = (req) => {
  try {
    const token = req.cookies && req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded.user.id;
    }
  } catch (e) {
    console.log('[AUTH] Token verification failed:', e.message);
  }
  return null;
};

/**
 * @route   GET /api/chatbot/history
 * @desc    Get user's complete chat history from database
 * @access  Private (authenticated users only)
 */
router.get('/history', auth, async (req, res) => {
  try {
    console.log(`[HISTORY] Fetching chat for user: ${req.user.id}`);
    
    const chat = await Chat.findOne({ user: req.user.id });
    
    if (!chat || !chat.messages || chat.messages.length === 0) {
      console.log(`[HISTORY] No chat history found for user: ${req.user.id}`);
      return res.json({ messages: [] });
    }
    
    console.log(`[HISTORY] ✅ Returning ${chat.messages.length} messages for user: ${req.user.id}`);
    res.json({ messages: chat.messages });
  } catch (err) {
    console.error('[HISTORY] ❌ Error fetching chat history:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

/**
 * @route   POST /api/chatbot
 * @desc    Process chatbot message with FULL CONTEXT from database
 * @access  Public (works for both authenticated and guest users)
 */
router.post('/', async (req, res) => {
  const { message, context } = req.body;

  // Validate input
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ msg: 'Valid message is required.' });
  }

  const sanitizedMessage = message.trim().slice(0, 2000);
  console.log('\n========================================');
  console.log('[CHATBOT] New message received:', sanitizedMessage.substring(0, 50) + '...');

  try {
    // Check authentication
    const userId = getUserFromToken(req);
    console.log(`[CHATBOT] User authenticated: ${userId ? `YES (${userId})` : 'NO (Guest)'}`);
    
    let conversationHistory = [];
    let userChat = null;

    if (userId) {
      // ==========================================
      // AUTHENTICATED USER FLOW
      // ==========================================
      console.log(`[CHATBOT] 🔍 STEP 1: Fetching existing chat from database for user ${userId}...`);
      
      // FETCH EXISTING CHAT FROM DATABASE FIRST
      userChat = await Chat.findOne({ user: userId });
      
      if (userChat && userChat.messages && userChat.messages.length > 0) {
        console.log(`[CHATBOT] ✅ STEP 2: Found existing chat with ${userChat.messages.length} messages`);
        
        // Load ALL previous messages for FULL context (limit to last 100 for performance)
        const contextLimit = 100;
        const recentMessages = userChat.messages.slice(-contextLimit);
        
        // Convert to Gemini format
        conversationHistory = recentMessages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));
        
        console.log(`[CHATBOT] 📚 STEP 3: Loaded ${conversationHistory.length} messages for context`);
        console.log(`[CHATBOT] 📝 Last user message: "${recentMessages[recentMessages.length - 1]?.text?.substring(0, 50)}..."`);
      } else {
        console.log(`[CHATBOT] 📭 STEP 2: No existing chat found. This is a new conversation.`);
      }
      
    } else {
      // ==========================================
      // GUEST USER FLOW
      // ==========================================
      console.log(`[CHATBOT] 👤 Guest user - using client-provided context`);
      
      if (Array.isArray(context) && context.length > 0) {
        const contextLimit = 100;
        const recentMessages = context.slice(-contextLimit);
        
        conversationHistory = recentMessages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));
        
        console.log(`[CHATBOT] 📚 Loaded ${conversationHistory.length} messages from client context`);
      } else {
        console.log(`[CHATBOT] 📭 No context provided. This is a new guest conversation.`);
      }
    }

    // ==========================================
    // GENERATE AI RESPONSE WITH FULL CONTEXT
    // ==========================================
    console.log(`[CHATBOT] 🤖 STEP 4: Sending to Gemini with ${conversationHistory.length} context messages...`);
    
    const model = genAI.getGenerativeModel({ 
      model: MODEL_CONFIG.model,
      systemInstruction: SYSTEM_PROMPT 
    });

    // Start chat with FULL history
    const chatSession = model.startChat({
      history: conversationHistory,
      generationConfig: MODEL_CONFIG.generationConfig,
    });

    // Send new message
    const result = await chatSession.sendMessage(sanitizedMessage);
    const aiMessage = result.response.text().trim();

    if (!aiMessage || aiMessage.length === 0) {
      throw new Error('Empty response from AI model');
    }

    console.log(`[CHATBOT] ✅ STEP 5: Received AI response (${aiMessage.length} chars)`);
    console.log(`[CHATBOT] 💬 Response preview: "${aiMessage.substring(0, 100)}..."`);

    // ==========================================
    // SAVE TO DATABASE (AUTHENTICATED USERS ONLY)
    // ==========================================
    if (userId) {
      console.log(`[CHATBOT] 💾 STEP 6: Saving to database for user ${userId}...`);
      
      if (!userChat) {
        // Create new chat document if doesn't exist
        console.log(`[CHATBOT] 📝 Creating new chat document...`);
        userChat = new Chat({ 
          user: userId, 
          messages: [],
          messageCount: 0,
          lastActivity: new Date()
        });
      }

      // Add BOTH user message and bot response
      userChat.messages.push({
        sender: 'user',
        text: sanitizedMessage,
        timestamp: new Date()
      });
      
      userChat.messages.push({
        sender: 'bot',
        text: aiMessage,
        timestamp: new Date()
      });
      
      // Keep last 200 messages to prevent document bloat
      if (userChat.messages.length > 200) {
        console.log(`[CHATBOT] ⚠️ Trimming old messages (keeping last 200)`);
        userChat.messages = userChat.messages.slice(-200);
      }
      
      userChat.lastActivity = new Date();
      userChat.messageCount = userChat.messages.length;
      
      // SAVE TO DATABASE
      await userChat.save();
      
      console.log(`[CHATBOT] ✅ STEP 7: Successfully saved to database!`);
      console.log(`[CHATBOT] 📊 Total messages in database: ${userChat.messageCount}`);
    } else {
      console.log(`[CHATBOT] ⚠️ Guest user - NOT saving to database`);
    }

    console.log('[CHATBOT] ✅ Request completed successfully');
    console.log('========================================\n');

    // Return AI response to frontend
    res.json({ message: aiMessage });

  } catch (err) {
    console.error('[CHATBOT] ❌ ERROR occurred:', err.message || err);
    console.error('[CHATBOT] Full error:', err);
    console.log('========================================\n');
    
    // Handle specific errors
    if (err.message && err.message.includes('API key')) {
      return res.status(500).json({ msg: 'API configuration error. Please contact support.' });
    }
    
    if (err.message && (err.message.includes('quota') || err.message.includes('429'))) {
      return res.status(429).json({ msg: 'Service temporarily unavailable. Please try again later.' });
    }

    res.status(500).json({ msg: 'Unable to process your request. Please try again.' });
  }
});

/**
 * @route   DELETE /api/chatbot/history
 * @desc    Clear user's chat history from database (ONLY way to delete)
 * @access  Private
 */
router.delete('/history', auth, async (req, res) => {
  try {
    console.log(`[DELETE] Clearing chat for user: ${req.user.id}`);
    
    const result = await Chat.findOneAndDelete({ user: req.user.id });
    
    if (!result) {
      console.log(`[DELETE] No chat found for user: ${req.user.id}`);
      return res.json({ msg: 'No chat history found' });
    }
    
    console.log(`[DELETE] ✅ Deleted ${result.messages.length} messages for user: ${req.user.id}`);
    res.json({ msg: 'Chat history cleared successfully' });
  } catch (err) {
    console.error('[DELETE] ❌ Error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

/**
 * @route   GET /api/chatbot/stats
 * @desc    Get chat statistics
 * @access  Private
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({ user: req.user.id });
    
    if (!chat) {
      return res.json({ 
        totalMessages: 0,
        userMessages: 0,
        botMessages: 0,
        lastActivity: null
      });
    }
    
    const userMessages = chat.messages.filter(m => m.sender === 'user').length;
    const botMessages = chat.messages.filter(m => m.sender === 'bot').length;
    
    res.json({
      totalMessages: chat.messages.length,
      userMessages,
      botMessages,
      lastActivity: chat.lastActivity
    });
  } catch (err) {
    console.error('[STATS] Error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
