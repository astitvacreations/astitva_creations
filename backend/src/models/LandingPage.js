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
    heroEyebrow: { type: String, default: '' },
    aboutTitle: { type: String, default: '' },
    aboutEyebrow: { type: String, default: '' },
    portfolioTitle: { type: String, default: '' },
    featuresTitle: { type: String, default: '' },
    offersTitle: { type: String, default: '' },
    videosTitle: { type: String, default: '' },
    testimonialsTitle: { type: String, default: '' },
    ctaTitle: { type: String, default: '' },
    ctaSubtitle: { type: String, default: '' },
    stickyCtaText: { type: String, default: '' },
    alignments: {
      hero: { type: String, default: 'center' },
      about: { type: String, default: 'center' },
      portfolio: { type: String, default: 'center' },
      features: { type: String, default: 'center' },
      offers: { type: String, default: 'center' },
      videos: { type: String, default: 'center' },
      testimonials: { type: String, default: 'center' },
      cta: { type: String, default: 'center' },
    },
    bodyText: { type: String, default: '' },
    heroSlides: { type: [heroSlideSchema], default: [] },
    galleryImages: [{ type: String }],
    youtubeLinks: [{ type: String }],
    videoUrl: { type: String, default: '' },
    vrImageUrl: { type: String, default: '' },
    features: [{
      title: { type: String, required: true },
      description: { type: String, required: true }
    }],
    approach: [{
      title: { type: String, required: true },
      description: { type: String, required: true }
    }],
    offers: [{
      title: { type: String, required: true },
      description: { type: String, required: true }
    }],
    ctaLabel: { type: String, default: 'Contact Us' },
    ctaLink: { type: String, default: '/quote' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const LandingPage = mongoose.model('LandingPage', landingPageSchema);

// nodemon trigger
