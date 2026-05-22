import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // Couple/Client Name
    slug: { type: String, required: true, unique: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    coverImage: {
      url: { type: String },
      public_id: { type: String },
      position: { type: String, default: 'center' }
    },
    mainImage: {
      url: { type: String },
      public_id: { type: String },
      position: { type: String, default: 'center' }
    },
    images: [{
      url: { type: String, required: true },
      public_id: { type: String, required: true },
      category: { type: String }
    }],
    videoUrls: [{ type: String }], // Array of video URLs
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Project = mongoose.model('Project', projectSchema);
