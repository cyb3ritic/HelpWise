// routes/conversations.js
const express = require('express');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const router = express.Router();

/**
 * @route   GET /api/conversations/user/all
 * @desc    Get all conversations for the authenticated user
 * @access  Private
 */
router.get('/user/all', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id })
      .populate('participants', 'firstName lastName email')
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    console.error('Error fetching user conversations:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST /api/conversations
 * @desc    Create a new conversation between two users
 * @access  Private
 */
router.post(
  '/',
  [
    auth,
    [
      check('participants', 'Participants are required').isArray({ min: 2 }),
      check('participants.*', 'Each participant must be a valid Mongo ID').isMongoId(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return all validation errors
      return res.status(400).json({ errors: errors.array() });
    }

    const { participants } = req.body;

    try {
      // Check if a conversation between these participants already exists
      const existingConversation = await Conversation.findOne({
        participants: { $all: participants, $size: participants.length },
      });

      if (existingConversation) {
        return res.json(existingConversation);
      }

      // Create new conversation
      const newConversation = new Conversation({
        participants,
      });

      const conversation = await newConversation.save();
      res.json(conversation);
    } catch (err) {
      console.error('Error creating conversation:', err.message);
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   GET /api/conversations/:conversationId
 * @desc    Get a specific conversation
 * @access  Private
 */
router.get('/:conversationId', auth, async (req, res) => {
  const { conversationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return res.status(400).json({ msg: 'Invalid Conversation ID' });
  }

  try {
    const conversation = await Conversation.findById(conversationId).populate('participants', 'firstName lastName email');
    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }

    // Ensure the authenticated user is part of the conversation
    if (!conversation.participants.some((p) => p._id.toString() === req.user.id)) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json(conversation);
  } catch (err) {
    console.error('Error fetching conversation:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST /api/conversations/:conversationId/messages
 * @desc    Send a message in a conversation
 * @access  Private
 */
router.post(
  '/:conversationId/messages',
  [
    auth,
    [
      check('message', 'Message content is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const { conversationId } = req.params;
    const { message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ msg: 'Invalid Conversation ID' });
    }

    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ msg: 'Conversation not found' });
      }

      // Ensure the authenticated user is part of the conversation
      if (!conversation.participants.includes(req.user.id)) {
        return res.status(403).json({ msg: 'Access denied' });
      }

      // Create new message
      const newMessage = new Message({
        conversationId,
        sender: req.user.id,
        content: message,
      });

      const savedMessage = await newMessage.save();

      // Update conversation's updatedAt field
      conversation.updatedAt = Date.now();
      await conversation.save();

      // Populate sender details
      await savedMessage.populate('sender', 'firstName lastName email');

      res.json(savedMessage);

      // Emit the saved message to all participants in the room
      req.io.to(conversationId).emit('chatMessage', {
        _id: savedMessage._id,
        conversationId: savedMessage.conversationId,
        sender: savedMessage.sender, // Populated sender
        content: savedMessage.content,
        createdAt: savedMessage.createdAt,
      });

    } catch (err) {
      console.error('Error sending message:', err.message);
      res.status(500).send('Server Error');
    }
  }
);

/**
 * @route   GET /api/conversations/:conversationId/messages
 * @desc    Get all messages in a conversation
 * @access  Private
 */
router.get('/:conversationId/messages', auth, async (req, res) => {
  const { conversationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return res.status(400).json({ msg: 'Invalid Conversation ID' });
  }

  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }

    // Ensure the authenticated user is part of the conversation
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const messages = await Message.find({ conversationId })
      .populate('sender', 'firstName lastName email')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   DELETE /api/conversations/:conversationId/messages
 * @desc    Clear all messages in a conversation
 * @access  Private
 */
router.delete('/:conversationId/messages', auth, async (req, res) => {
  const { conversationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return res.status(400).json({ msg: 'Invalid Conversation ID' });
  }

  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }

    // Ensure the authenticated user is part of the conversation
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Delete all messages for this conversation
    await Message.deleteMany({ conversationId });

    res.json({ msg: 'Chat cleared successfully' });

    // Emit event to clear chat for all participants
    req.io.to(conversationId).emit('chatCleared', { conversationId });

  } catch (err) {
    console.error('Error clearing chat:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
