import mongoose from 'mongoose';

const propInventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    defaultPrice: { type: Number, required: true, min: 0 },
    image: { type: String }
  },
  { timestamps: true }
);

export const PropInventoryItem = mongoose.model('PropInventoryItem', propInventoryItemSchema);
