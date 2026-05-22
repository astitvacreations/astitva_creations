import mongoose from 'mongoose';
import { Setting } from './src/models/Setting.js';
import { LandingPage } from './src/models/LandingPage.js';
import 'dotenv/config';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  const s = await Setting.findOne();
  console.log('Settings:', JSON.stringify(s, null, 2));
  
  const pages = await LandingPage.find();
  console.log('Landing Pages:', JSON.stringify(pages, null, 2));
  
  await mongoose.disconnect();
}

run().catch(console.error);
