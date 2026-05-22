import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['PAGE_VIEW', 'QUOTE_SUBMIT', 'WHATSAPP_CLICK', 'CALL_CLICK'], required: true },
    pageUrl: { type: String },
    userAgent: { type: String },
    ipAddress: { type: String }, // Can be hashed or partially stored for privacy
  },
  { timestamps: true }
);

export const Analytics = mongoose.model('Analytics', analyticsSchema);
