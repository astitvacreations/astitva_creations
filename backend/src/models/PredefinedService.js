import mongoose from 'mongoose';

const predefinedServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    defaultPrice: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

export const PredefinedService = mongoose.model('PredefinedService', predefinedServiceSchema);
