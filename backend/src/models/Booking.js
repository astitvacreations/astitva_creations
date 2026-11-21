import mongoose from 'mongoose';
import { paymentInstallmentSchema } from './Event.js';

const bookingSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    eventDate: { type: Date, required: true },
    location: { type: String, required: true },
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
    subServices: [{ type: String }],
    duration: { type: String, enum: ['Full Day', 'Half Day'], required: true },
    estimatedPrice: { type: Number, required: true },
    totalAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
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
    status: { type: String, enum: ['PENDING', 'CONTACTED', 'CONFIRMED', 'CANCELLED'], default: 'PENDING' },
    notes: { type: String }
  },
  { timestamps: true }
);

export const Booking = mongoose.model('Booking', bookingSchema);
