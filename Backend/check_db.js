const mongoose = require('mongoose');
const dotenv = require('dotenv');
const TypeOfHelp = require('./models/TypeOfHelp');

dotenv.config();

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected for Checking');

        const count = await TypeOfHelp.countDocuments();
        console.log(`TypeOfHelp Count: ${count}`);

        const items = await TypeOfHelp.find();
        console.log('Items:', JSON.stringify(items, null, 2));

        mongoose.connection.close();
    } catch (err) {
        console.error('Checking Error:', err);
        process.exit(1);
    }
};

checkDB();
