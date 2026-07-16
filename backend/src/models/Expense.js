import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['GENERAL_STUDIO', 'STUDIO_SHOOT', 'PROP_RENTAL', 'EVENT'],
      required: true
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'onModel',
      default: null
    },
    onModel: {
      type: String,
      enum: ['Booking', 'PropRental', 'Event'],
      default: null
    },
    expenseName: { type: String, required: true },
    description: { type: String },
    amount: { type: Number, required: true, min: 0 },
    expenseDate: { type: Date, required: true, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
  },
  { timestamps: true }
);

export const Expense = mongoose.model('Expense', expenseSchema);
