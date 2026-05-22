import mongoose from 'mongoose';

const addonSchema = new mongoose.Schema(
  {
    addonName: { type: String, required: true }, // e.g. "Event Instant Reels", "YouTube Live (Full Day)", "LED Screen"
    basePrice: { type: Number, required: true },
    description: { type: String },
    minQuantity: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Addon = mongoose.model('Addon', addonSchema);
