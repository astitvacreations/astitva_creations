import mongoose from 'mongoose';

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
    finalTotal: { type: Number, default: function() { return this.estimatedPrice || 0; } },
    paidAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['PENDING', 'CONTACTED', 'CONFIRMED', 'CANCELLED'], default: 'PENDING' },
    notes: { type: String }
  },
  { timestamps: true }
);

export const Booking = mongoose.model('Booking', bookingSchema);
