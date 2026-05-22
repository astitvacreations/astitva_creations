import mongoose from 'mongoose';

const heroSlideSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  description: { type: String, default: '' },
}, { _id: false });

const landingPageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true }, // 'wedding' | 'pre-wedding'
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    bodyText: { type: String, default: '' },
    heroSlides: { type: [heroSlideSchema], default: [] },
    galleryImages: [{ type: String }],
    ctaLabel: { type: String, default: 'Book Your Story' },
    ctaLink: { type: String, default: '/quote' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const LandingPage = mongoose.model('LandingPage', landingPageSchema);
