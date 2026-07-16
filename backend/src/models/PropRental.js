import mongoose from 'mongoose';

const propRentalSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    rentalDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    itemsRented: [{ 
      item: { type: mongoose.Schema.Types.ObjectId, ref: 'PropInventoryItem' },
      name: { type: String, required: true },
      price: { type: Number, required: true }
    }],
    additionalCharges: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    discounts: { type: Number, default: 0 },
    finalTotal: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ['PENDING', 'ACTIVE', 'RETURNED', 'CANCELLED'], 
      default: 'PENDING' 
    },
    notes: { type: String }
  },
  { timestamps: true }
);

export const PropRental = mongoose.model('PropRental', propRentalSchema);
