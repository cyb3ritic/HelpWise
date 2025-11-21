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

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read for the authenticated user
// @access  Private
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.json({ msg: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/notifications/:notificationId
// @desc    Delete a specific notification
// @access  Private
router.delete('/:notificationId', auth, async (req, res) => {
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

    await Notification.findByIdAndDelete(notificationId);

    res.json({ msg: 'Notification removed.' });
  } catch (err) {
    console.error('Error deleting notification:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/notifications
// @desc    Delete all notifications for the authenticated user
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });
    res.json({ msg: 'All notifications cleared.' });
  } catch (err) {
    console.error('Error clearing notifications:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
