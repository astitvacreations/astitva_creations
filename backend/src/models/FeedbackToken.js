import mongoose from 'mongoose';
import crypto from 'crypto';

const feedbackTokenSchema = new mongoose.Schema({
  email: { type: String, required: true },
  clientName: { type: String, required: true },
  eventType: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  isUsed: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

export const FeedbackToken = mongoose.model('FeedbackToken', feedbackTokenSchema);
