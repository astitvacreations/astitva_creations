import mongoose from 'mongoose';
import { Project } from './src/models/Project.js';
import { Service } from './src/models/Service.js';
import 'dotenv/config';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  const services = await Service.find();
  console.log('--- Services Categories ---');
  services.forEach(s => console.log(`Service: ${s.title} (${s._id}) slug: ${s.slug}`));

  const projects = await Project.find();
  console.log('--- Projects count:', projects.length);
  if (projects.length > 0) {
    console.log('Sample Project:', JSON.stringify(projects[0], null, 2));
  }
  await mongoose.disconnect();
}

run().catch(console.error);
