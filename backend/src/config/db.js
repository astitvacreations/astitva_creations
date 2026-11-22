import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Drop legacy unique index on eventcrewassignments if present
    try {
      const collection = conn.connection.collection('eventcrewassignments');
      const indexes = await collection.indexes();
      const hasOldIndex = indexes.some(idx => idx.name === 'eventId_1_teamMemberId_1');
      if (hasOldIndex) {
        await collection.dropIndex('eventId_1_teamMemberId_1');
        console.log('Successfully dropped legacy index eventId_1_teamMemberId_1 from eventcrewassignments');
      }
    } catch (idxErr) {
      // Index might already be dropped or collection doesn't exist yet
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Backend will continue running without DB. Please configure MONGODB_URI.');
    // process.exit(1); // Do not crash the app, allow UI development
  }
};
