// routes/stats.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Request = require('../models/Request');
const Bid = require('../models/Bid');

// @route   GET /api/stats/dashboard
// @desc    Get dashboard statistics
// @access  Public
router.get('/dashboard', async (req, res) => {
  try {
    console.log('📊 Fetching dashboard stats...');

    // Parallel queries for better performance
    const [
      activeUsers,
      totalUsers,
      completedProjects,
      totalRequests,
      totalBids,
      openRequests,
      usersWithReviews,
    ] = await Promise.all([
      User.countDocuments({ isVerified: true }),
      User.countDocuments(),
      Request.countDocuments({ status: 'Completed' }),
      Request.countDocuments(),
      Bid.countDocuments(),
      Request.countDocuments({ status: 'Open' }),
      User.find({ 'reviews.0': { $exists: true } }).select('reviews'),
    ]);

    console.log('✅ Active users:', activeUsers);
    console.log('✅ Total users:', totalUsers);
    console.log('✅ Completed projects:', completedProjects);
    console.log('✅ Total requests:', totalRequests);
    console.log('✅ Total bids:', totalBids);
    console.log('✅ Open requests:', openRequests);

    // Calculate average rating from user reviews
    let averageRating = '0.0';
    let totalRating = 0;
    let totalReviews = 0;

    usersWithReviews.forEach((user) => {
      if (user.reviews && user.reviews.length > 0) {
        user.reviews.forEach((review) => {
          totalRating += review.rating;
          totalReviews++;
        });
      }
    });

    averageRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : '0.0';
    console.log('✅ Average rating:', averageRating, 'from', totalReviews, 'reviews');

    // Get recent activity count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentRequests, recentBids] = await Promise.all([
      Request.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Bid.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    console.log('✅ Recent requests (7d):', recentRequests);
    console.log('✅ Recent bids (7d):', recentBids);

    // Calculate average response time (time between request creation and first bid)
    let averageResponseTime = 'N/A';
    try {
      const requestsWithBids = await Request.aggregate([
        {
          $lookup: {
            from: 'bids',
            localField: '_id',
            foreignField: 'helpRequestId',
            as: 'bids',
          },
        },
        {
          $match: {
            'bids.0': { $exists: true },
          },
        },
        {
          $project: {
            createdAt: 1,
            firstBidTime: { $min: '$bids.createdAt' },
          },
        },
        {
          $project: {
            responseTime: {
              $divide: [{ $subtract: ['$firstBidTime', '$createdAt'] }, 1000 * 60 * 60],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: '$responseTime' },
          },
        },
      ]);

      if (requestsWithBids.length > 0 && requestsWithBids[0].avgResponseTime > 0) {
        const hours = Math.round(requestsWithBids[0].avgResponseTime);
        averageResponseTime = hours > 0 ? `${hours}hrs` : '<1hr';
      }

      console.log('✅ Average response time:', averageResponseTime);
    } catch (err) {
      console.log('⚠️  Error calculating response time:', err.message);
    }

    // Calculate satisfaction rate (completed projects with good ratings)
    let satisfactionRate = '0%';
    try {
      const completedWithReviews = await Request.aggregate([
        {
          $match: { status: 'Completed' },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'acceptedBidderId',
            foreignField: '_id',
            as: 'helper',
          },
        },
        {
          $unwind: { path: '$helper', preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            hasGoodReview: {
              $cond: {
                if: { $gte: [{ $size: { $ifNull: ['$helper.reviews', []] } }, 1] },
                then: {
                  $gte: [{ $avg: '$helper.reviews.rating' }, 4],
                },
                else: true,
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            satisfied: {
              $sum: { $cond: ['$hasGoodReview', 1, 0] },
            },
          },
        },
      ]);

      if (completedWithReviews.length > 0 && completedWithReviews[0].total > 0) {
        satisfactionRate = `${Math.round(
          (completedWithReviews[0].satisfied / completedWithReviews[0].total) * 100
        )}%`;
      }

      console.log('✅ Satisfaction rate:', satisfactionRate);
    } catch (err) {
      console.log('⚠️  Error calculating satisfaction rate:', err.message);
    }

    // Get in-progress requests count
    const inProgressRequests = await Request.countDocuments({ status: 'In Progress' });
    console.log('✅ In Progress requests:', inProgressRequests);

    const response = {
      activeUsers,
      totalUsers,
      completedProjects,
      averageRating,
      totalRequests,
      totalBids,
      recentRequests,
      recentBids,
      openRequests,
      inProgressRequests,
      averageResponseTime,
      satisfactionRate,
      supportAvailable: '24/7',
    };

    console.log('📤 Sending response:', response);
    res.json(response);
  } catch (err) {
    console.error('❌ Error fetching dashboard stats:', err);
    res.status(500).json({
      msg: 'Server error while fetching statistics',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

// @route   GET /api/stats/user/:userId
// @desc    Get user-specific statistics
// @access  Private
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`📊 Fetching stats for user: ${userId}`);

    // Validate userId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ msg: 'Invalid user ID format' });
    }

    // Parallel queries for better performance
    const [
      user,
      requestsCreated,
      bidsPlaced,
      projectsCompleted,
      pendingBids,
      acceptedBids,
      inProgressProjects,
      rejectedBids,
    ] = await Promise.all([
      User.findById(userId).select('credibilityPoints firstName lastName'),
      Request.countDocuments({ requesterId: userId }),
      Bid.countDocuments({ bidderId: userId }),
      Request.countDocuments({
        acceptedBidderId: userId,
        status: 'Completed',
      }),
      Bid.countDocuments({
        bidderId: userId,
        status: 'Pending',
      }),
      Bid.countDocuments({
        bidderId: userId,
        status: 'Accepted',
      }),
      Request.countDocuments({
        acceptedBidderId: userId,
        status: 'In Progress',
      }),
      Bid.countDocuments({
        bidderId: userId,
        status: 'Rejected',
      }),
    ]);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const credibilityPoints = user.credibilityPoints || 0;

    // Calculate success rate (accepted bids / total bids)
    const totalBidsPlaced = bidsPlaced;
    const successRate =
      totalBidsPlaced > 0
        ? `${Math.round((acceptedBids / totalBidsPlaced) * 100)}%`
        : '0%';

    const response = {
      userId: user._id,
      userName: `${user.firstName} ${user.lastName}`,
      requestsCreated,
      bidsPlaced,
      projectsCompleted,
      credibilityPoints,
      pendingBids,
      acceptedBids,
      rejectedBids,
      inProgressProjects,
      successRate,
    };

    console.log('✅ User stats fetched:', response);
    res.json(response);
  } catch (err) {
    console.error('❌ Error fetching user stats:', err);
    res.status(500).json({
      msg: 'Server error while fetching user statistics',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

// @route   GET /api/stats/platform-overview
// @desc    Get detailed platform overview with trends
// @access  Public
router.get('/platform-overview', async (req, res) => {
  try {
    console.log('📊 Fetching platform overview...');

    // Status breakdown
    const [openCount, inProgressCount, completedCount, closedCount] = await Promise.all([
      Request.countDocuments({ status: 'Open' }),
      Request.countDocuments({ status: 'In Progress' }),
      Request.countDocuments({ status: 'Completed' }),
      Request.countDocuments({ status: 'Closed' }),
    ]);

    // Bid status breakdown
    const [pendingBidsCount, acceptedBidsCount, rejectedBidsCount] = await Promise.all([
      Bid.countDocuments({ status: 'Pending' }),
      Bid.countDocuments({ status: 'Accepted' }),
      Bid.countDocuments({ status: 'Rejected' }),
    ]);

    // User verification breakdown
    const [verifiedUsers, unverifiedUsers] = await Promise.all([
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ isVerified: false }),
    ]);

    const response = {
      requests: {
        open: openCount,
        inProgress: inProgressCount,
        completed: completedCount,
        closed: closedCount,
        total: openCount + inProgressCount + completedCount + closedCount,
      },
      bids: {
        pending: pendingBidsCount,
        accepted: acceptedBidsCount,
        rejected: rejectedBidsCount,
        total: pendingBidsCount + acceptedBidsCount + rejectedBidsCount,
      },
      users: {
        verified: verifiedUsers,
        unverified: unverifiedUsers,
        total: verifiedUsers + unverifiedUsers,
      },
    };

    console.log('✅ Platform overview fetched');
    res.json(response);
  } catch (err) {
    console.error('❌ Error fetching platform overview:', err);
    res.status(500).json({
      msg: 'Server error while fetching platform overview',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

module.exports = router;
