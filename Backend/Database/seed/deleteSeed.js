const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const User = require('../../models/User');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await User.deleteMany({ email: { $regex: 'test.*@helpwise.com' } });
  console.log('Deleted', result.deletedCount, 'users');
  process.exit(0);
}
run();
