// routes/bids.js
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Bid = require('../models/Bid');
const Request = require('../models/Request');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

// @route   POST /api/bids
// @desc    Place a new bid on a help request
// @access  Private
// @route   POST /api/bids
// @desc    Place a new bid on a help request
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('helpRequestId', 'Help Request ID is required').isMongoId(),
      check('bidAmount', 'Bid Amount must be a positive number').isFloat({ gt: 0 }),
      // Optionally, validate message length
      check('message', 'Message must be at least 10 characters')
        .optional({ checkFalsy: true })
        .isLength({ min: 10 }),
    ],
  ],
  async (req, res) => {
    // Validate incoming request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return all validation errors
      return res.status(400).json({ errors: errors.array() });
    }

    const { helpRequestId, bidAmount, message } = req.body;

    try {
      // Validate Help Request
      const helpRequest = await Request.findById(helpRequestId);
      if (!helpRequest) {
        return res.status(404).json({ msg: 'Help Request not found' });
      }

      // Prevent users from bidding on their own requests
      if (helpRequest.requesterId.toString() === req.user.id) {
        return res.status(400).json({ msg: 'You cannot bid on your own help request' });
      }

      // Optional: Check if the user has already placed a bid
      const existingBid = await Bid.findOne({ helpRequestId, bidderId: req.user.id });
      if (existingBid) {
        return res.status(400).json({ msg: 'You have already placed a bid on this request' });
      }

      // Create new Bid
      const newBid = new Bid({
        helpRequestId,
        bidderId: req.user.id,
        bidAmount,
        message: message ? message.trim() : '',
      });

      const bid = await newBid.save();

      // Optionally, add the bid to the Request's bids array
      helpRequest.bids.push(bid._id);
      await helpRequest.save();

      // Re-fetch the bid with populated 'bidderId'
      const populatedBid = await Bid.findById(bid._id).populate('bidderId', 'firstName lastName credibilityPoints');

      res.json(populatedBid);
    } catch (err) {
      console.error('Error placing bid:', err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET /api/bids/user-bids
// @desc    Get all bids made by the authenticated user
// @access  Private
router.get('/user-bids', auth, async (req, res) => {
  try {
    const bids = await Bid.find({ bidderId: req.user.id })
      .populate({
        path: 'helpRequestId',
        populate: { path: 'typeOfHelp', select: 'name description' },
      })
      .populate('bidderId', 'firstName lastName email credibilityPoints')
      .sort({ createdAt: -1 });

    res.json(bids);
  } catch (err) {
    console.error('Error fetching user bids:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/bids/:helpRequestId
// @desc    Get all bids for a specific help request
// @access  Private
router.get('/:helpRequestId', auth, async (req, res) => {
  const { helpRequestId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(helpRequestId)) {
    return res.status(400).json({ msg: 'Invalid Help Request ID' });
  }

  try {
    const bids = await Bid.find({ helpRequestId })
      .populate('bidderId', 'firstName lastName credibilityPoints')
      .sort({ createdAt: -1 }); // Newest bids first

    res.json(bids);
  } catch (err) {
    console.error('Error fetching bids:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/bids/:bidId
// @desc    Update a bid's amount
// @access  Private (Only bid owner)
router.put(
  '/:bidId',
  [
    auth,
    [check('bidAmount', 'Bid Amount must be a positive number').isFloat({ gt: 0 })],
  ],
  async (req, res) => {
    const { bidId } = req.params;
    const { bidAmount } = req.body;

    // Validate bidId
    if (!mongoose.Types.ObjectId.isValid(bidId)) {
      return res.status(400).json({ msg: 'Invalid Bid ID' });
    }

    // Validate incoming request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return all validation errors
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Find the bid by ID
      const bid = await Bid.findById(bidId);
      if (!bid) {
        return res.status(404).json({ msg: 'Bid not found' });
      }

      // Check if the authenticated user is the owner of the bid
      if (bid.bidderId.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Access denied: You can only edit your own bids' });
      }

      // Check if the bid is in a state that allows editing (e.g., 'Pending')
      if (bid.status !== 'Pending') {
        return res.status(400).json({ msg: `Cannot edit a bid with status '${bid.status}'` });
      }

      // Check if the associated help request is still open and within response time
      const helpRequest = await Request.findById(bid.helpRequestId);
      if (!helpRequest) {
        return res.status(404).json({ msg: 'Associated Help Request not found' });
      }

      if (helpRequest.status !== 'Open') {
        return res.status(400).json({ msg: `Cannot edit bids on a '${helpRequest.status}' request` });
      }

      // Check if the response deadline has passed
      if (new Date() > new Date(helpRequest.responseDeadline)) {
        return res.status(400).json({ msg: 'Cannot edit bid after the response deadline has passed' });
      }

      // Check if any bid has been accepted
      const acceptedBid = await Bid.findOne({
        helpRequestId: helpRequest._id,
        status: 'Accepted',
      });
      if (acceptedBid) {
        return res.status(400).json({ msg: 'Cannot edit bid after a bid has been accepted' });
      }

      // Update bid fields
      bid.bidAmount = parseFloat(bidAmount);

      // Save the updated bid
      await bid.save();

      // Re-fetch the bid with populated 'bidderId'
      const populatedBid = await Bid.findById(bid._id).populate('bidderId', 'firstName lastName credibilityPoints');

      res.json(populatedBid);
    } catch (err) {
      console.error('Error updating bid:', err.message);
      res.status(500).send('Server Error');
    }
  }
);

// routes/bids.js

// ... existing imports ...

// @route   POST /api/bids/:bidId/accept
// @desc    Accept a bid and decline others
// @access  Private
router.post('/:bidId/accept', auth, async (req, res) => {
  const { bidId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(bidId)) {
    return res.status(400).json({ msg: 'Invalid Bid ID' });
  }

  try {
    const bid = await Bid.findById(bidId).populate('bidderId');
    if (!bid) {
      return res.status(404).json({ msg: 'Bid not found' });
    }

    const helpRequest = await Request.findById(bid.helpRequestId);
    if (!helpRequest) {
      return res.status(404).json({ msg: 'Help Request not found' });
    }

    // Ensure the authenticated user is the requester
    if (helpRequest.requesterId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    // Accept the selected bid
    bid.status = 'Accepted';
    await bid.save();

    // Decline all other bids for the same request
    await Bid.updateMany(
      { helpRequestId: helpRequest._id, _id: { $ne: bidId } },
      { status: 'Declined' }
    );

    // Update the help request status
    helpRequest.status = 'In Progress';
    await helpRequest.save();

    // Create Notification for Accepted Bid
    await Notification.create({
      user: bid.bidderId._id,
      type: 'Bid Accepted',
      message: `Your bid for "${helpRequest.title}" has been accepted.`,
      relatedBid: bid._id,
    });

    // Create Notifications for Declined Bids
    const declinedBids = await Bid.find({ helpRequestId: helpRequest._id, status: 'Declined' }).populate('bidderId');
    const notifications = declinedBids.map((declinedBid) => ({
      user: declinedBid.bidderId._id,
      type: 'Bid Rejected',
      message: `Your bid for "${helpRequest.title}" has been declined.`,
      relatedBid: declinedBid._id,
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({ msg: 'Bid accepted successfully.' });
  } catch (err) {
    console.error('Error accepting bid:', err.message);
    res.status(500).send('Server Error');
  }
});



// Existing Reject Bid Endpoint
router.post('/:bidId/reject', auth, async (req, res) => {
  const { bidId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(bidId)) {
    return res.status(400).json({ msg: 'Invalid Bid ID' });
  }

  try {
    const bid = await Bid.findById(bidId).populate('bidderId');
    if (!bid) {
      return res.status(404).json({ msg: 'Bid not found' });
    }

    const helpRequest = await Request.findById(bid.helpRequestId);
    if (!helpRequest) {
      return res.status(404).json({ msg: 'Help Request not found' });
    }

    // Ensure the authenticated user is the requester
    if (helpRequest.requesterId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    bid.status = 'Declined';
    await bid.save();

    // Create Notification for Rejected Bid
    await Notification.create({
      user: bid.bidderId._id,
      type: 'Bid Rejected',
      message: `Your bid for "${helpRequest.title}" has been rejected.`,
      relatedBid: bid._id,
    });

    res.json({ msg: 'Bid rejected successfully.' });
  } catch (err) {
    console.error('Error rejecting bid:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/bids/:bidId/complete
// @desc    Mark a bid as completed
// @access  Private
router.put('/:bidId/complete', auth, async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.bidId).populate('helpRequestId');
    if (!bid) return res.status(404).json({ msg: 'Bid not found' });

    const helpRequest = bid.helpRequestId;

    // Only the requester can mark the bid as completed
    if (helpRequest.requesterId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    if (bid.status !== 'Accepted') {
      return res.status(400).json({ msg: 'Bid is not in an accepted state' });
    }

    // Update bid status to Completed
    bid.status = 'Completed';
    bid.agreedAmount = bid.bidAmount; // Assuming no negotiation
    await bid.save();

    // Update help request status to Completed
    helpRequest.status = 'Completed';
    await helpRequest.save();

    // Update bidder's credibility points
    const bidder = await User.findById(bid.bidderId);
    bidder.credibilityPoints += 10; // Example: +10 points for completing a task
    await bidder.save();

    res.json(bid);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/bids/:bidId/details
// @desc    Get detailed information about a specific bid
// @access  Private
router.get('/:bidId/details', auth, async (req, res) => {
  const { bidId } = req.params;

  // Validate bidId
  if (!mongoose.Types.ObjectId.isValid(bidId)) {
    return res.status(400).json({ msg: 'Invalid Bid ID' });
  }

  try {
    // Find the bid by ID and populate related fields
    const bid = await Bid.findById(bidId)
      .populate('bidderId', 'firstName lastName email credibilityPoints') // Populate bidder details
      .populate({
        path: 'helpRequestId',
        populate: { path: 'typeOfHelp', select: 'name description' },
      }); // Populate help request and its type of help

    if (!bid) {
      return res.status(404).json({ msg: 'Bid not found' });
    }

    // Ensure the authenticated user is either the bidder or the help request owner
    const helpRequest = await Request.findById(bid.helpRequestId._id);
    if (
      bid.bidderId._id.toString() !== req.user.id &&
      helpRequest.requesterId.toString() !== req.user.id
    ) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json({ bid });
  } catch (err) {
    console.error('Error fetching bid details:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
