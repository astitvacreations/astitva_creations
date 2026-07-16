import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    eventName: { type: String, required: true },
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    eventDate: { type: Date, required: true },
    location: { type: String },
    subEvents: [{
      name: { type: String, required: true },
      services: [{
        service: { type: mongoose.Schema.Types.ObjectId, ref: 'PredefinedService' },
        name: { type: String, required: true },
        price: { type: Number, required: true }
      }]
    }],
    deliverables: [{ type: String }],
    complimentaries: [{ type: String }],
    discountPercentage: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    additionalCharges: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    finalTotal: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'], 
      default: 'PENDING' 
    },
    notes: { type: String },
    shootStatus: { type: String },
    progressTracking: [{ type: String }],
    slot: { type: String }
  },
  { timestamps: true }
);

export const Event = mongoose.model('Event', eventSchema);
