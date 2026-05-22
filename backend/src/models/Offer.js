import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g. "Grand Celebration Combo", "Seasonal Spring Discount"
    offerCode: { type: String, required: true, unique: true }, // e.g. "GRANDCOMBO", "SPRING15"
    type: { type: String, enum: ['SEASONAL', 'COMBO'], required: true },
    discountType: { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
    discountValue: { type: Number, required: true }, // e.g. 15 for 15% discount or 25000 for fixed ₹25k off
    minOrderValue: { type: Number, default: 0 },
    requiredEvents: [{ type: String }], // E.g. ['Engagement', 'Haldi', 'Wedding'] to qualify for combo
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Offer = mongoose.model('Offer', offerSchema);
