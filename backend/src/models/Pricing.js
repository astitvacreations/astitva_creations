import mongoose from 'mongoose';

const pricingSchema = new mongoose.Schema(
  {
    serviceName: { type: String, required: true, unique: true }, // e.g. "Wedding", "Haldi", "Cinematic Video"
    category: { type: String, required: true }, // 'Main Service', 'Sub Service'
    basePrice: { type: Number, required: true }, // Base price or Half Day price
    fullDayPrice: { type: Number }, // Optional if applicable
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Pricing = mongoose.model('Pricing', pricingSchema);
