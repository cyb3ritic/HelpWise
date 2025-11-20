// routes/notifications.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get all notifications for the authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/notifications/:notificationId/read
// @desc    Mark a notification as read
// @access  Private
router.put('/:notificationId/read', auth, async (req, res) => {
  const { notificationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return res.status(400).json({ msg: 'Invalid Notification ID' });
  }

  try {
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    // Ensure the notification belongs to the authenticated user
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    notification.read = true;
    await notification.save();

    res.json({ msg: 'Notification marked as read.' });
  } catch (err) {
    console.error('Error marking notification as read:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
