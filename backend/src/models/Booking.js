import mongoose from 'mongoose';
import { paymentInstallmentSchema } from './Event.js';

const bookingSchema = new mongoose.Schema(
  {
    customerName: { type: String, default: 'Valued Client' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    eventDate: { type: Date, default: Date.now },
    location: { type: String, default: 'TBD' },
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
    subServices: [{ type: String }],
    selectedEvents: [{ type: String }],
    eventConfigs: { type: mongoose.Schema.Types.Mixed, default: {} },
    deliverables: [{ type: mongoose.Schema.Types.Mixed }],
    complimentaries: [{ type: String }],
    addOns: [{ type: mongoose.Schema.Types.Mixed }],
    album: { type: mongoose.Schema.Types.Mixed },
    duration: { type: String, default: 'Full Day' },
    estimatedPrice: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountType: { type: String, default: 'amount' },
    discountValue: { type: Number, default: 0 },
    netPayable: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },
    finalTotal: { type: Number, default: function() { return this.estimatedPrice || 0; } },
    paidAmount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['Unpaid', 'Partially Paid', 'Fully Paid', 'Overdue'],
      default: 'Unpaid'
    },
    payments: [paymentInstallmentSchema],
    status: { type: String, enum: ['PENDING', 'CONTACTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'], default: 'PENDING' },
    notes: { type: String, default: '' },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    activeVersionNumber: { type: Number, default: 1 },
    activeQuotationNumber: { type: String, default: '1' },
    agreementVersionNumber: { type: Number, default: null },
    versions: [{
      versionNumber: { type: Number, required: true },
      quotationNumber: { type: String, required: true },
      versionName: { type: String, default: '' },
      note: { type: String, default: '' },
      isAgreement: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
      date: { type: String, default: '' },
      totalAmount: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      netPayable: { type: Number, default: 0 },
      subEventList: [{ type: mongoose.Schema.Types.Mixed }],
      deliverables: [{ type: mongoose.Schema.Types.Mixed }],
      complimentaries: [{ type: String }],
      addOns: [{ type: mongoose.Schema.Types.Mixed }],
      album: { type: mongoose.Schema.Types.Mixed }
    }]
  },
  { timestamps: true }
);

export const Booking = mongoose.model('Booking', bookingSchema);
