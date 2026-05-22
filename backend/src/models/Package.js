import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema(
  {
    packageName: { type: String, required: true }, // e.g., "Conceptual Pre-Wedding", "Standard Photo Album", "Documentary Video Editing"
    category: { 
      type: String, 
      enum: ['Pre-Wedding Style', 'Post Production Editing', 'Photo Album'], 
      required: true 
    },
    basePrice: { type: Number, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Package = mongoose.model('Package', packageSchema);
