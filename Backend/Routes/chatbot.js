// routes/chatbot.js
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const Request = require('../models/Request');
const Bid = require('../models/Bid');
const TypeOfHelp = require('../models/TypeOfHelp');
const jwt = require('jsonwebtoken');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model configuration
const MODEL_CONFIG = {
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  },
};

// --- Helper Functions ---

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

// --- Intent Detection & Logic ---

const INTENTS = {
  GREETING: 'GREETING',
  CREATE_REQUEST: 'CREATE_REQUEST',
  SEARCH_REQUESTS: 'SEARCH_REQUESTS',
  MY_BIDS: 'MY_BIDS',
  SUPPORT: 'SUPPORT',
  UNKNOWN: 'UNKNOWN',
  CANCEL: 'CANCEL'
};

const SYSTEM_PROMPT = `You are a smart assistant for the HelpWise platform.
Your goal is to classify user intent and extract information.

Intents:
- CREATE_REQUEST: User wants to post a new help request OR says "I need help", "help me", "create request", "I want to create a request".
- SEARCH_REQUESTS: User wants to find work or see requests (e.g., "show me cleaning jobs", "find requests nearby", "search requests").
- MY_BIDS: User asks about their bids or status (e.g., "did I get the job?", "show my bids", "my bids").
- SUPPORT: General help, questions about the platform, or reporting issues.
- GREETING: Hello, hi, hey.
- CANCEL: User wants to stop the current action.

You must respond with a VALID JSON object. Do not include markdown formatting like \`\`\`json.

Output Format:
{
  "intent": "INTENT_NAME",
  "entities": { ...extracted data... },
  "confidence": 0.0-1.0
}
`;

async function detectIntent(message, history = []) {
  // Manual overrides for common phrases
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('create request') || lowerMsg.includes('post request') || lowerMsg === 'i need help') {
    console.log('[CHATBOT] Manual Override: CREATE_REQUEST');
    return { intent: INTENTS.CREATE_REQUEST, confidence: 1.0 };
  }
  if (lowerMsg.includes('find requests') || lowerMsg.includes('search requests')) {
    console.log('[CHATBOT] Manual Override: SEARCH_REQUESTS');
    return { intent: INTENTS.SEARCH_REQUESTS, confidence: 1.0 };
  }
  if (lowerMsg.includes('my bids') || lowerMsg.includes('show bids')) {
    console.log('[CHATBOT] Manual Override: MY_BIDS');
    return { intent: INTENTS.MY_BIDS, confidence: 1.0 };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL_CONFIG.model,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: { responseMimeType: "application/json" }
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    console.log('[CHATBOT] Raw Intent Response:', responseText);

    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('[CHATBOT] JSON Parse Error:', parseError);
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    }
  } catch (e) {
    console.error("Intent detection failed:", e);
    return { intent: INTENTS.SUPPORT, confidence: 0 };
  }
}

// --- Handlers ---

async function handleCreateRequest(userId, message, sessionState, chatDoc) {
  const step = sessionState.step || 'INIT';
  let slots = sessionState.slots || {};
  let responseText = '';
  let nextStep = step;
  let metadata = null;

  if (message.toLowerCase() === 'cancel') {
    await Chat.updateOne({ _id: chatDoc._id }, { $set: { 'sessionState.intent': null, 'sessionState.step': null, 'sessionState.slots': {} } });
    return { text: "Request creation cancelled. How else can I help?", metadata: null };
  }

  switch (step) {
    case 'INIT':
      responseText = "Sure, I can help you post a request. First, where is the help needed? (City/Location)";
      nextStep = 'ASK_LOCATION';
      break;

    case 'ASK_LOCATION':
      slots.location = message;
      responseText = "Got it. What kind of help do you need? (e.g., Plumbing, Moving, Cleaning)";
      nextStep = 'ASK_TYPE';
      break;

    case 'ASK_TYPE':
      slots.type = message;
      responseText = "Okay. Please describe the task in a bit more detail.";
      nextStep = 'ASK_DESCRIPTION';
      break;

    case 'ASK_DESCRIPTION':
      slots.description = message;
      responseText = "When do you need this done? (e.g., Tomorrow, Next Week, ASAP)";
      nextStep = 'ASK_TIME';
      break;

    case 'ASK_TIME':
      slots.time = message;
      responseText = `Great! Here's a summary:\n\n📍 Location: ${slots.location}\n🔧 Type: ${slots.type}\n📝 Description: ${slots.description}\n⏰ Time: ${slots.time}\n\nShall I post this request?`;
      metadata = {
        type: 'CONFIRMATION',
        data: slots,
        quickReplies: [
          { label: 'Yes, Post It', value: 'yes' },
          { label: 'No, Cancel', value: 'cancel' }
        ]
      };
      nextStep = 'CONFIRM';
      break;

    case 'CONFIRM':
      if (message.toLowerCase().includes('yes')) {
        try {
          let typeOfHelpDoc = await TypeOfHelp.findOne({ name: { $regex: slots.type, $options: 'i' } });
          if (!typeOfHelpDoc) {
            typeOfHelpDoc = await TypeOfHelp.findOne({});
          }

          if (!typeOfHelpDoc) {
            throw new Error("No TypeOfHelp found in database");
          }

          const deadline = new Date();
          deadline.setDate(deadline.getDate() + 7);

          const newRequest = new Request({
            requesterId: userId,
            title: `${slots.type} in ${slots.location}`,
            description: slots.description,
            typeOfHelp: typeOfHelpDoc._id,
            location: slots.location,
            offeredAmount: 50,
            responseDeadline: deadline,
            workDeadline: deadline,
            status: 'Open'
          });
          await newRequest.save();
          responseText = "✅ Your request has been posted successfully! Helpers will be notified.";
          metadata = { type: 'REQUEST_CREATED', requestId: newRequest._id };
        } catch (err) {
          console.error(err);
          responseText = "I'm sorry, but I failed to create the request due to an error.";
        }
        nextStep = null;
        slots = {};
      } else {
        responseText = "Okay, I've cancelled the request.";
        nextStep = null;
        slots = {};
      }
      break;
  }

  if (nextStep) {
    await Chat.updateOne({ _id: chatDoc._id }, {
      $set: {
        'sessionState.intent': INTENTS.CREATE_REQUEST,
        'sessionState.step': nextStep,
        'sessionState.slots': slots
      }
    });
  } else {
    await Chat.updateOne({ _id: chatDoc._id }, {
      $set: {
        'sessionState.intent': null,
        'sessionState.step': null,
        'sessionState.slots': {}
      }
    });
  }

  return { text: responseText, metadata };
}

async function handleSearchRequests(message) {
  // Case-insensitive replacement
  const keywords = message.replace(/find/gi, '').replace(/search/gi, '').replace(/requests/gi, '').trim();

  console.log('[CHATBOT] Search Keywords:', keywords);

  let query = { status: 'Open' };
  if (keywords) {
    query.$or = [
      { title: { $regex: keywords, $options: 'i' } },
      { description: { $regex: keywords, $options: 'i' } },
      { location: { $regex: keywords, $options: 'i' } }
    ];
  }

  console.log('[CHATBOT] Search Query:', JSON.stringify(query));

  const requests = await Request.find(query).limit(5).sort({ createdAt: -1 });
  console.log('[CHATBOT] Found Requests:', requests.length);

  if (requests.length === 0) {
    return { text: "I couldn't find any open requests matching your search.", metadata: null };
  }

  return {
    text: `I found ${requests.length} requests for you:`,
    metadata: {
      type: 'REQUEST_LIST',
      data: requests
    }
  };
}

async function handleMyBids(userId) {
  // Use helpRequestId instead of requestId
  const bids = await Bid.find({ bidderId: userId }).populate('helpRequestId', 'title status');

  if (bids.length === 0) {
    return { text: "You haven't placed any bids yet.", metadata: null };
  }

  return {
    text: "Here are your recent bids:",
    metadata: {
      type: 'BID_LIST',
      data: bids
    }
  };
}

// --- Main Route ---

router.post('/', async (req, res) => {
  console.log('[CHATBOT] Request received:', req.body);
  const { message } = req.body;
  const userId = getUserFromToken(req);

  if (!message) return res.status(400).json({ msg: 'Message required' });

  try {
    let chat = null;
    let sessionState = { intent: null, step: null, slots: {} };

    if (userId) {
      chat = await Chat.findOne({ user: userId });
      if (!chat) {
        chat = new Chat({ user: userId, messages: [] });
        await chat.save();
      }
      sessionState = chat.sessionState || { intent: null, step: null, slots: {} };
    }

    // 1. Check if we are in an active flow
    if (sessionState.intent === INTENTS.CREATE_REQUEST && sessionState.step) {
      const response = await handleCreateRequest(userId, message, sessionState, chat);
      if (userId) await chat.addMessages(message, response.text, response.metadata);
      return res.json({ message: response.text, metadata: response.metadata });
    }

    // 2. Detect Intent
    const detection = await detectIntent(message);
    const intent = detection.intent;
    console.log(`[CHATBOT] Detected Intent: ${intent} (${detection.confidence})`);

    let response = { text: "I'm not sure how to help with that.", metadata: null };

    switch (intent) {
      case INTENTS.CREATE_REQUEST:
        if (!userId) {
          response.text = "You need to be logged in to create a request.";
        } else {
          response = await handleCreateRequest(userId, message, { step: 'INIT', slots: {} }, chat);
        }
        break;

      case INTENTS.SEARCH_REQUESTS:
        response = await handleSearchRequests(message);
        break;

      case INTENTS.MY_BIDS:
        if (!userId) {
          response.text = "Please log in to view your bids.";
        } else {
          response = await handleMyBids(userId);
        }
        break;

      case INTENTS.GREETING:
        response.text = "Hello! How can I help you today? You can ask me to find requests, create a new request, or check your bids.";
        response.metadata = {
          quickReplies: [
            { label: 'Find Requests', value: 'Find requests' },
            { label: 'Create Request', value: 'I need help' },
            { label: 'My Bids', value: 'Show my bids' }
          ]
        };
        break;

      case INTENTS.SUPPORT:
      default:
        const model = genAI.getGenerativeModel({ model: MODEL_CONFIG.model });
        const chatSession = model.startChat({});
        const result = await chatSession.sendMessage(message);
        response.text = result.response.text();
        break;
    }

    // Save to DB
    if (userId && chat) {
      await chat.addMessages(message, response.text, response.metadata);
    }

    res.json({ message: response.text, metadata: response.metadata });

  } catch (err) {
    console.error('[CHATBOT] Error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({ user: req.user.id });
    res.json({ messages: chat ? chat.messages : [] });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

router.delete('/history', auth, async (req, res) => {
  try {
    await Chat.findOneAndDelete({ user: req.user.id });
    res.json({ msg: 'History cleared' });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;