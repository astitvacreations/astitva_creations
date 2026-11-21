import mongoose from 'mongoose';

const receiptCounterSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  seq: { type: Number, default: 0 }
});

export const ReceiptCounter = mongoose.model('ReceiptCounter', receiptCounterSchema);

/**
 * Atomically generates a sequential receipt number per year (e.g., RCP-2026-0001)
 */
export const getNextReceiptNumber = async () => {
  const year = new Date().getFullYear();
  const counter = await ReceiptCounter.findOneAndUpdate(
    { year },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return `RCP-${year}-${String(counter.seq).padStart(4, '0')}`;
};
