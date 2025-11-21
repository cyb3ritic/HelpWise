// routes/payments.js
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const auth = require('../middleware/auth');
const Bid = require('../models/Bid');
const Request = require('../models/Request');
const User = require('../models/User');
require('dotenv').config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// @route   POST /api/payments/create-payment-intent
// @desc    Create a payment intent for a bid
// @access  Private
router.post('/create-payment-intent', [
  auth,
  [
    check('bidId', 'bidId is required').not().isEmpty(),
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { bidId } = req.body;

  try {
    const bid = await Bid.findById(bidId).populate('helpRequestId');
    if (!bid) return res.status(404).json({ msg: 'Bid not found' });

    const helpRequest = bid.helpRequestId;

    // Only the requester can initiate payment
    if (helpRequest.requesterId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    if (bid.status !== 'Accepted') {
      return res.status(400).json({ msg: 'Bid is not accepted' });
    }

    // Calculate amounts in cents
    const amountInCents = Math.round(bid.agreedAmount * 100); // Total amount
    const platformFeeInCents = Math.round(bid.platformFee * 100); // Platform fee
    const helperAmountInCents = amountInCents - platformFeeInCents; // 90%

    // Create a PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: { bidId: bid._id.toString() },
      // transfer_data is used with Stripe Connect to transfer funds to helper
      // Requires Stripe Connect setup
      // Uncomment and set up connected accounts accordingly
      /*
      transfer_data: {
        destination: bidder.stripeConnectedAccountId,
        amount: helperAmountInCents,
      },
      */
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/payments/webhook
// @desc    Handle Stripe webhook events
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      const bidId = paymentIntent.metadata.bidId;

      // Update bid and help request statuses
      try {
        const bid = await Bid.findById(bidId).populate('helpRequestId');
        if (!bid) throw new Error('Bid not found');

        bid.status = 'Completed';
        bid.agreedAmount = bid.bidAmount;
        await bid.save();

        const helpRequest = await Request.findById(bid.helpRequestId._id);
        helpRequest.status = 'Completed';
        await helpRequest.save();

        // Transfer funds to helper using Stripe Connect (if set up)
        /*
        await stripe.transfers.create({
          amount: Math.round(bid.bidAmount * 100), // Amount in cents
          currency: 'usd',
          destination: bidder.stripeConnectedAccountId,
          transfer_group: paymentIntent.id,
        });
        */

        // Update credibility points
        const bidder = await User.findById(bid.bidderId);
        bidder.credibilityPoints += 10; // Example: +10 points for completing a task
        await bidder.save();

      } catch (err) {
        console.error(err.message);
        // Optionally, handle failed updates
      }

      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
});

module.exports = router;
