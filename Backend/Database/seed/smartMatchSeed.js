const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
// Load .env from backend root
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../../models/User');
const TypeOfHelp = require('../../models/TypeOfHelp');
const { generateEmbedding } = require('../../utils/embeddings');

// Amrita School of Engineering, Bangalore
const CENTER_LAT = 12.9044;
const CENTER_LNG = 77.6696;
const RADIUS_KM = 10;

// Helper to generate random location within radius
function getRandomLocation(lat, lng, radiusInKm) {
  const r = radiusInKm / 111.3; // roughly 111.3 km per degree
  const u = Math.random();
  const v = Math.random();
  const w = r * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  // Adjust for longitude scaling
  const newLng = x / Math.cos(lat * Math.PI / 180);
  return { lat: lat + y, lng: lng + newLng };
}

const userProfiles = [
  { role: 'Tech Expert', typeName: 'Tech Support', bio: 'Expert in setting up Wi-Fi, removing viruses, and general computer repair.' },
  { role: 'Moving Pro', typeName: 'Moving Help', bio: 'Strong and capable mover. I have a truck and can help you relocate furniture safely.' },
  { role: 'Pet Lover', typeName: 'Pet Care', bio: 'Experienced pet sitter and dog walker. I treat your furry friends like family.' },
  { role: 'Master Gardener', typeName: 'Gardening', bio: 'Landscaping, mowing lawns, and fixing sprinklers. I have a green thumb.' },
  { role: 'Expert Tutor', typeName: 'Tutoring', bio: 'Math and science tutor for high school students. I make learning easy and fun.' },
  { role: 'Deep Cleaner', typeName: 'Cleaning', bio: 'Professional deep cleaner. I can make your house shine and help with post-party cleanup.' },
  { role: 'Handyman', typeName: 'Home Repair', bio: 'General home repairs, fixing drywall, mounting TVs, basic plumbing and electrical.' },
  { role: 'All-Rounder', typeName: 'Other', bio: 'Happy to help with random tasks like running errands, assembling furniture, etc.' }
];

async function seed() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined. Ensure you are running this from the Backend directory.");
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    let typesOfHelp = await TypeOfHelp.find();
    if (typesOfHelp.length === 0) {
       console.log('Creating dummy TypeOfHelp since none exist...');
       const newType = new TypeOfHelp({ name: 'General Support', description: 'General help and support' });
       await newType.save();
       typesOfHelp = [newType];
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test@123', salt);

    console.log('Generating 25 users... this will take a moment due to embeddings generation.');

    for (let i = 1; i <= 25; i++) {
      const profile = userProfiles[i % userProfiles.length];
      const typeDoc = typesOfHelp.find(t => t.name === profile.typeName);
      const matchedType = typeDoc || typesOfHelp[0];
      const loc = getRandomLocation(CENTER_LAT, CENTER_LNG, RADIUS_KM);
      
      const email = `test${i}@helpwise.com`;
      
      // Check if exists
      const existing = await User.findOne({ email });
      if (existing) {
        console.log(`User ${email} already exists, skipping.`);
        continue;
      }

      const firstName = `TestUser${i}`;
      const lastName = profile.role;
      const textToEmbed = `Name: ${firstName} ${lastName}. Bio: ${profile.bio}. Expertise: ${matchedType.name}.`;
      
      console.log(`Generating embedding for User ${i}...`);
      const embedding = await generateEmbedding(textToEmbed);

      const user = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        isVerified: true,
        bio: profile.bio,
        expertise: [matchedType._id],
        skillsEmbedding: embedding,
        homeLocation: {
          type: 'Point',
          coordinates: [loc.lng, loc.lat]
        }
      });

      await user.save();
      console.log(`Saved User ${i} (${profile.role}) at [${loc.lng.toFixed(4)}, ${loc.lat.toFixed(4)}]`);
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
