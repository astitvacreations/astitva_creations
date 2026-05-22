import mongoose from 'mongoose';
import 'dotenv/config';

const pricingSchema = new mongoose.Schema(
  {
    serviceName: { type: String, required: true },
    category: { type: String, required: true },
    basePrice: { type: Number, required: true },
    fullDayPrice: { type: Number },
    isActive: { type: Boolean, default: true }
  },
  { collection: 'pricings' }
);

const Pricing = mongoose.model('Pricing', pricingSchema);

const dump = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("MONGODB_URI not found");
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    const list = await Pricing.find();
    console.log("DATABASE_PRICING_DUMP:", JSON.stringify(list, null, 2));
    mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
};

dump();
