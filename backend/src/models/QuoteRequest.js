import mongoose from 'mongoose';

const quoteRequestSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    eventDate: { type: Date },
    location: { type: String },
    notes: { type: String },

    selectedEvents: [{ type: String }],
    eventConfigs: { type: mongoose.Schema.Types.Mixed }, // Maps { [eventName]: { duration, services: [] } }
    preWedding: {
      style: { type: String },
      cost: { type: Number, default: 0 }
    },
    postProduction: {
      editing: { type: String },
      cost: { type: Number, default: 0 }
    },
    album: {
      albumType: { type: String },
      sheets: { type: Number, default: 0 },
      cost: { type: Number, default: 0 }
    },
    addOns: { type: mongoose.Schema.Types.Mixed }, // Maps selected add-on toggles & quantities
    appliedOffer: {
      title: { type: String },
      discountValue: { type: Number, default: 0 }
    },

    discount: { type: Number, default: 0 },
    discountType: { type: String, enum: ['amount', 'percentage'], default: 'amount' },
    discountValue: { type: Number, default: 0 },
    estimatedPrice: { type: Number, required: true },
    deliveryTimeline: { type: String },
    terms: [{ type: String }],
    status: {
      type: String,
      enum: ['PENDING', 'CONTACTED', 'CONFIRMED', 'CANCELLED', 'LOST'],
      default: 'PENDING'
    }
  },
  { timestamps: true }
);

export const QuoteRequest = mongoose.model('QuoteRequest', quoteRequestSchema);
