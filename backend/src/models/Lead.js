import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    eventDate: { type: Date },
    location: { type: String },
    notes: { type: String },
    source: { type: String, default: 'general' }, // e.g. 'wedding', 'pre-wedding', 'vrwedding'
    status: {
      type: String,
      enum: ['PENDING', 'CONTACTED', 'CONVERTED', 'LOST'],
      default: 'PENDING'
    }
  },
  { timestamps: true }
);

export const Lead = mongoose.model('Lead', leadSchema);
