// routes/requests.js
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Request = require('../models/Request');
const TypeOfHelp = require('../models/TypeOfHelp');
const Bid = require('../models/Bid');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

/**
 * @route   POST /api/requests
 * @desc    Create a new help request
 * @access  Private
 */
router.post(
  '/',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('typeOfHelp', 'Type of Help ID is required').isMongoId(),
      check('offeredAmount', 'Offered Amount must be a number').isFloat({ gt: 0 }),
      check('responseDeadline', 'Response Deadline must be a valid date').isISO8601(),
      check('workDeadline', 'Work Deadline must be a valid date').isISO8601(),
    ],
  ],
  async (req, res) => {
    // You can add additional validations here
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, typeOfHelp, offeredAmount, responseDeadline, workDeadline } = req.body;

    try {
      const type = await TypeOfHelp.findById(typeOfHelp);
      if (!type) {
        return res.status(400).json({ errors: [{ msg: 'Invalid Type of Help' }] });
      }

      const newRequest = new Request({
        title,
        description,
        typeOfHelp,
        offeredAmount,
        responseDeadline,
        workDeadline,
        requesterId: req.user.id,
      });

      const request = await newRequest.save();

      // Emit notification to all connected clients
      req.io.emit('newRequest', request);

      res.json(request);
    } catch (err) {
      console.error('Error creating Request:', err.message);
      res.status(500).send('Server error');
    }
  }
);

/**
 * @route   GET /api/requests
 * @desc    Get all help requests
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const requests = await Request.find()
      .populate('typeOfHelp', 'name')
      .populate('requesterId', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error('Error fetching Requests:', err.message);
    res.status(500).send('Server error');
  }
});

/**
 * @route   PUT /api/requests/:id
 * @desc    Update a help request
 * @access  Private (Only requester)
 */
router.put(
  '/:id',
  [
    auth,
    [
      // Add validations as needed
      check('title', 'Title cannot be empty').optional().not().isEmpty(),
      check('description', 'Description cannot be empty').optional().not().isEmpty(),
      check('typeOfHelp', 'Type of Help ID must be a valid Mongo ID').optional().isMongoId(),
      check('offeredAmount', 'Offered Amount must be a positive number').optional().isFloat({ gt: 0 }),
      check('responseDeadline', 'Response Deadline must be a valid date').optional().isISO8601(),
      check('workDeadline', 'Work Deadline must be a valid date').optional().isISO8601(),
    ],
  ],
  async (req, res) => {
    // For simplicity, allowing updating all fields except requesterId and status
    const { title, description, typeOfHelp, offeredAmount, responseDeadline, workDeadline } = req.body;

    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (typeOfHelp) updateFields.typeOfHelp = typeOfHelp;
    if (offeredAmount) updateFields.offeredAmount = offeredAmount;
    if (responseDeadline) updateFields.responseDeadline = responseDeadline;
    if (workDeadline) updateFields.workDeadline = workDeadline;

    try {
      let request = await Request.findById(req.params.id);
      if (!request) {
        return res.status(404).json({ msg: 'Help Request not found' });
      }

      // Only the requester can update the request
      if (request.requesterId.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Access denied' });
      }

      request = await Request.findByIdAndUpdate(
        req.params.id,
        { $set: updateFields },
        { new: true }
      )
        .populate('typeOfHelp', 'name')
        .populate('requesterId', 'firstName lastName');

      res.json(request);
    } catch (err) {
      console.error('Error updating Request:', err.message);
      res.status(500).send('Server error');
    }
  }
);

/**
 * @route   PUT /api/requests/:id/close
 * @desc    Close a help request (update status to 'Closed')
 * @access  Private (Only requester)
 */
router.put('/:id/close', auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ msg: 'Help Request not found' });
    }

    // Only the requester can close the request
    if (request.requesterId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Update status to 'Closed'
    request.status = 'Closed';
    await request.save();

    res.json(request);
  } catch (err) {
    console.error('Error closing Request:', err.message);
    res.status(500).send('Server error');
  }
});



/**
 * @route   GET /api/requests/user-requests
 * @desc    Get all help requests created by the authenticated user
 * @access  Private
 */
router.get('/user-requests', auth, async (req, res) => {
  try {
    const helpRequests = await Request.find({ requesterId: req.user.id })
      .populate('typeOfHelp', 'name description')
      .populate('requesterId', 'firstName lastName')
      .sort({ createdAt: -1 }); // Newest requests first

    res.json(helpRequests);
  } catch (err) {
    console.error('Error fetching user help requests:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/requests/:requestId/bidders
 * @desc    Get the bidder with the minimum adjusted bid amount
 * @access  Private
 */
router.get('/:requestId/bidders', auth, async (req, res) => {
  const { requestId } = req.params;

  // Validate requestId
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    return res.status(400).json({ msg: 'Invalid Help Request ID' });
  }

  try {
    // Fetch the help request
    const helpRequest = await Request.findById(requestId);
    if (!helpRequest) {
      return res.status(404).json({ msg: 'Help Request not found' });
    }

    // Ensure the authenticated user is the requester
    if (helpRequest.requesterId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    // Get all pending bids for the help request
    let bids = await Bid.find({
      helpRequestId: requestId,
      status: 'Pending',
    }).populate('bidderId', 'firstName lastName credibilityPoints');

    if (bids.length === 0) {
      return res.status(200).json({ msg: 'No bids available for this help request.' });
    }

    const offeredAmount = helpRequest.offeredAmount;
    const amountPromised = offeredAmount * 0.9;

    // Find the bid with the smallest bidAmount
    const minBid = bids.reduce((prev, current) => {
      return current.bidAmount < prev.bidAmount ? current : prev;
    }, bids[0]);

    // Adjust the minBid based on amountPromised
    let adjustedBidAmount;
    let adjustedExplanation;

    if (minBid.bidAmount >= amountPromised) {
      adjustedBidAmount = parseFloat((minBid.bidAmount * 1.1).toFixed(2));
      adjustedExplanation = 'Bid amount is greater than or equal to 90% of the offered amount. Added 10% to bid amount.';
    } else {
      adjustedBidAmount = parseFloat(offeredAmount.toFixed(2));
      adjustedExplanation = 'Bid amount is less than 90% of the offered amount. Using the offered amount.';
    }

    // Prepare the adjusted bid
    const adjustedBid = minBid.toObject();
    adjustedBid.adjustedBidAmount = adjustedBidAmount;
    adjustedBid.adjustedExplanation = adjustedExplanation;

    res.json([adjustedBid]);

  } catch (err) {
    console.error('Error fetching bidders:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
// Dynamic Routes should be placed after static routes to prevent route conflicts

/**
 * @route   GET /api/requests/:id
 * @desc    Get a single help request by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('typeOfHelp', 'name')
      .populate('requesterId', 'firstName lastName');

    if (!request) {
      return res.status(404).json({ msg: 'Help Request not found' });
    }

    res.json(request);
  } catch (err) {
    console.error('Error fetching Request by ID:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Help Request not found' });
    }
    res.status(500).send('Server error');
  }
});

/**
 * @route   DELETE /api/requests/:id
 * @desc    Delete a help request
 * @access  Private (Only requester)
 */
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  // Validate the ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'Invalid Help Request ID' });
  }

  try {
    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ msg: 'Help Request not found' });
    }

    // Only the requester can delete the request
    if (request.requesterId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Delete associated bids if necessary
    await Bid.deleteMany({ helpRequestId: id });

    // Delete the request
    await Request.findByIdAndDelete(id);

    res.json({ msg: 'Help Request removed successfully.' });
  } catch (err) {
    console.error('Error deleting Request:', err);
    res.status(500).send('Server error');
  }
});



/**
 * @route   PUT /api/requests/:requestId/response-time
 * @desc    Update response deadline for a help request
 * @access  Private
 */
router.put('/:requestId/response-time', auth, async (req, res) => {
  const { requestId } = req.params;
  const { newResponseDeadline } = req.body;

  // Validate requestId
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    return res.status(400).json({ msg: 'Invalid Request ID' });
  }

  // Validate newResponseDeadline
  if (!newResponseDeadline || isNaN(Date.parse(newResponseDeadline))) {
    return res.status(400).json({ msg: 'Invalid new response deadline.' });
  }

  try {
    const helpRequest = await Request.findById(requestId);
    if (!helpRequest) {
      return res.status(404).json({ msg: 'Help Request not found' });
    }

    // Ensure the authenticated user is the requester
    if (helpRequest.requesterId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    // Update response deadline
    helpRequest.responseDeadline = new Date(newResponseDeadline);
    await helpRequest.save();

    res.json({ msg: 'Response deadline updated successfully.' });
  } catch (err) {
    console.error('Error updating response deadline:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
