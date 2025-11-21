// scheduler.js
const cron = require('node-cron');
const Request = require('./models/Request'); // Adjust the path if necessary

// Schedule the task to run every minute
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const requestsToClose = await Request.find({
      responseDeadline: { $lte: now },
      status: { $ne: 'Closed' },
    });

    for (const request of requestsToClose) {
      request.status = 'Closed';
      await request.save();
      console.log(`Request ${request._id} has been automatically closed.`);
    }
  } catch (err) {
    console.error('Error during scheduled closure:', err);
  }
});
