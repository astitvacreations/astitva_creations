import mongoose from 'mongoose';

const serviceHeroSlideSchema = new mongoose.Schema({
  url: { type: String, required: true },
  position: { type: String, default: '50% 50%' },
}, { _id: false });

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    coverImage: { type: String, required: true }, // Cloudinary URL
    coverImagePosition: { type: String, default: '50% 50%' },
    images: [{ type: String }], // Array of image URLs for the category gallery
    videos: [{ type: String }], // Array of Cloudinary video URLs
    heroImage: { type: String, default: '' }, // Full-width parallax banner image for service page
    heroImages: { type: [serviceHeroSlideSchema], default: [] }, // Array of hero slider images
    heroDescription: { type: String, default: '' }, // Short tagline shown in service page hero
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Service = mongoose.model('Service', serviceSchema);
