const mongoose = require('mongoose');
const dotenv = require('dotenv');
const TypeOfHelp = require('./models/TypeOfHelp');

dotenv.config();

const seedData = [
    { name: 'Tutoring', description: 'Academic help and tutoring services' },
    { name: 'Moving Help', description: 'Assistance with moving boxes and furniture' },
    { name: 'Cleaning', description: 'House cleaning and organization' },
    { name: 'Tech Support', description: 'Computer and software assistance' },
    { name: 'Gardening', description: 'Lawn care and gardening help' },
    { name: 'Pet Care', description: 'Dog walking and pet sitting' },
    { name: 'Home Repair', description: 'Minor home repairs and maintenance' },
    { name: 'Other', description: 'Other types of assistance' }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected for Seeding');

        // Clear existing data
        await TypeOfHelp.deleteMany({});
        console.log('Cleared TypeOfHelp collection');

        // Insert new data
        await TypeOfHelp.insertMany(seedData);
        console.log('Seeded TypeOfHelp collection');

        mongoose.connection.close();
        console.log('Database connection closed');
    } catch (err) {
        console.error('Seeding Error:', err);
        process.exit(1);
    }
};

seedDB();
