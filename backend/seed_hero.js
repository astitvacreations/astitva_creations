import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Setting } from './src/models/Setting.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://astitvacreations1008_db_user:2hcSu37xZIEUc799@cluster0.jtdgb4n.mongodb.net/test?appName=Cluster0';

async function seed() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const settings = await Setting.findOne();
  if (settings) {
    settings.heroSlides = [
      {
        imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80',
        caption: 'Capturing Timeless Elegance',
        description: 'Your Story, Told Cinematically.',
        position: '50% 50%'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&q=80',
        caption: '',
        description: 'Every moment, beautifully preserved',
        position: '50% 50%'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80',
        caption: '',
        description: 'Cinematic stories for the ages',
        position: '50% 50%'
      }
    ];
    await settings.save();
    console.log('Successfully seeded settings slides in Atlas!');
  } else {
    console.log('No settings document found!');
  }
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
