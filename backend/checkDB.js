import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Setting } from './src/models/Setting.js';

dotenv.config();

async function checkDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    // Check current schema paths
    console.log('Schema Paths:', Object.keys(Setting.schema.paths));
    
    let setting = await Setting.findOne();
    if (!setting) {
      console.log('No setting document found');
      process.exit(0);
    }
    
    console.log('Current ownerImage in DB:', setting.ownerImage);
    
    // Force update using native driver to bypass mongoose if needed
    // await mongoose.connection.collection('settings').updateOne({}, { $set: { ownerImage: "TEST" } });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkDB();
