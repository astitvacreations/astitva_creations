import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Admin from './src/models/Admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Support running from root or backend
dotenv.config();

const adminEmails = [
  'astitvacreations1008@gmail.com',
  'official@astitvacreations.com',
  'tirus324@gmail.com',
  'shisuraj@gmail.com',
  'ssaiprasanth333@gmail.com'
];

const DEFAULT_PASSWORD = 'Password123!';

const seedAdmins = async () => {
  try {
    const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/astitva';
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected...');

    for (const email of adminEmails) {
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        console.log(`Admin ${email} already exists. Skipping.`);
      } else {
        const newAdmin = new Admin({
          email,
          password: DEFAULT_PASSWORD
        });
        await newAdmin.save();
        console.log(`Created admin account for: ${email}`);
      }
    }

    console.log('\nAdmin seeding complete!');
    console.log(`All seeded accounts have the default password: ${DEFAULT_PASSWORD}`);
    console.log('Users should log in and use the "Forgot Password" feature to reset it to something secure.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admins:', error);
    process.exit(1);
  }
};

seedAdmins();
