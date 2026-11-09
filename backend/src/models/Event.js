import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuoteRequest' },
    eventName: { type: String, required: true },
    customerName: { type: String, default: 'Client' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    eventDate: { type: Date, default: Date.now },
    location: { type: String, default: '' },
    subEvents: [{
      name: { type: String, default: 'Event' },
      services: [{
        service: { type: mongoose.Schema.Types.ObjectId, ref: 'PredefinedService' },
        name: { type: String, default: '' },
        price: { type: Number, default: 0 }
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
