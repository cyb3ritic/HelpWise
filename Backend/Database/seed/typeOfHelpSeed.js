// seed/typeOfHelpSeed.js
const mongoose = require('mongoose');
const TypeOfHelp = require('../../models/TypeOfHelp');
require('dotenv').config();

const typeOfHelpData = [
  { name: 'Tutoring', description: 'Academic assistance and tutoring services.' },
  { name: 'Handyman Services', description: 'Home repairs and maintenance.' },
  { name: 'Transportation', description: 'Help with moving or transportation needs.' },
  { name: 'IT Support', description: 'Technical assistance with computers and software.' },
  { name: 'Gardening', description: 'Gardening and landscaping services.' },
  { name: 'Cooking', description: 'Meal preparation and cooking services.' },
  { name: 'Cleaning', description: 'House cleaning and organizing services.' },
  { name: 'Personal Training', description: 'Fitness and personal training services.' },
  // Add more types as needed
];

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB Connected');
  await TypeOfHelp.deleteMany({});
  await TypeOfHelp.insertMany(typeOfHelpData);
  console.log('TypeOfHelp data seeded');
  mongoose.disconnect();
})
.catch(err => console.log(err));
