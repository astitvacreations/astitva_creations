import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    phone: { 
      type: String, 
      trim: true,
      default: ''
    },
    email: { 
      type: String, 
      trim: true, 
      lowercase: true,
      default: ''
    },
    role: { 
      type: String, 
      default: 'Photographer / Cinematographer' 
    },
    primarySkills: [{ 
      type: String,
      enum: [
        'Lead Candid Photographer', 
        'Traditional Photographer', 
        'Candid Cinematographer', 
        'Traditional Videographer', 
        'Drone Pilot', 
        'Photo Editor', 
        'Video Editor', 
        'Shoot Assistant / Lighting'
      ]
    }],
    upiId: { 
      type: String, 
      trim: true, 
      default: '' 
    },
    bankDetails: {
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' },
      accountHolder: { type: String, default: '' }
    },
    standardDayRate: { 
      type: Number, 
      default: 0 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    notes: { 
      type: String, 
      default: '' 
    }
  },
  { timestamps: true }
);

export const TeamMember = mongoose.model('TeamMember', teamMemberSchema);
