import mongoose from 'mongoose';

const landingPageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true }, // e.g. 'wedding', 'pre-wedding'
    title: { type: String, required: true }, // The internal name of the landing page
    
    // Visibility toggles (checkboxes)
    visibility: {
      hero: { type: Boolean, default: true },
      heroPrice: { type: Boolean, default: true }, // Added hero price visibility
      vr360View: { type: Boolean, default: true },
      introVideo: { type: Boolean, default: true },
      approach: { type: Boolean, default: true },
      whatWeDoBest: { type: Boolean, default: true },
      bestClicks: { type: Boolean, default: true },
      whyLoveUs: { type: Boolean, default: true },
      comfort: { type: Boolean, default: true },
      weddingFilms: { type: Boolean, default: true },
      packages: { type: Boolean, default: true },
      finalCta: { type: Boolean, default: true },
      finalCtaSubtitle: { type: Boolean, default: true }, // Added final cta subtitle visibility
    },

    // Alignments for section headings/text
    alignments: {
      hero: { type: String, default: 'center' }, // left, center, right
      vr360View: { type: String, default: 'center' },
      introVideo: { type: String, default: 'center' },
      approach: { type: String, default: 'center' },
      whatWeDoBest: { type: String, default: 'center' },
      bestClicks: { type: String, default: 'center' },
      whyLoveUs: { type: String, default: 'center' },
      comfort: { type: String, default: 'center' },
      weddingFilms: { type: String, default: 'center' },
      packages: { type: String, default: 'center' },
      finalCta: { type: String, default: 'center' },
    },

    // Global Styles for Landing Page
    navbar: {
      stickyText: { type: String, default: 'Hurry, Limited Slots Available!' },
      ctaLabel: { type: String, default: 'Book Now' },
      ctaLink: { type: String, default: '/quote' },
    },
    buttonStyle: {
      borderRadius: { type: String, default: 'none' }, // none, sm, md, lg, full
    },

    // 1. Hero Section
    hero: {
      eyebrow: { type: String, default: 'Astitva Creations' },
      title: { type: String, default: 'Timeless Wedding Photography' },
      subtitle: { type: String, default: '"Your Love Story, Captured Forever."' },
      description: { type: String, default: 'Professional wedding photography & cinematography with stunning visuals, creative storytelling, and unforgettable memories.' },
      backgroundImageUrl: { type: String, default: '' },
      priceStart: { type: String, default: '₹24,999/-' },
      ctaLabel: { type: String, default: 'Book Now' },
      ctaLink: { type: String, default: '/quote' }
    },

    // 1.5. VR 360 View Section
    vr360View: {
      title: { type: String, default: 'Immersive 360° Experience' },
      images: [{ type: String }] // Array of 360 equirectangular image URLs
    },

    // 2. Intro Video Section
    introVideo: {
      title: { type: String, default: 'Every Moment. Every Emotion. Beautifully Preserved.' },
      videoUrl: { type: String, default: '' }, // Can be used if clicking opens a modal or links out
      thumbnailUrl: { type: String, default: '' }
    },

    // 3. Our Approach
    approach: {
      title: { type: String, default: 'Our Approach' },
      subtitle: { type: String, default: 'Capturing the purest moments with utmost care and creativity.' },
      items: [{
        number: { type: String, default: '01' },
        title: { type: String, default: '' },
        description: { type: String, default: '' }
      }]
    },

    // 4. What We Do Best
    whatWeDoBest: {
      title: { type: String, default: 'What We Do Best' },
      items: [{
        label: { type: String, default: '' }, // e.g. "ROMANTIC"
        title: { type: String, default: '' }, // e.g. "Pre-Wedding Shoots"
        description: { type: String, default: '' },
        images: [{ type: String }] // Array of image URLs
      }]
    },

    // 5. Our Best Clicks
    bestClicks: {
      title: { type: String, default: 'Our Best Clicks' },
      images: [{ type: String }] // Array of image URLs
    },

    // 6. Why Couples Love Our Studio
    whyLoveUs: {
      title: { type: String, default: 'Why Couples Love Our Studio' },
      items: [{
        title: { type: String, default: '' },
        description: { type: String, default: '' }
      }]
    },

    // 7. Comfort & Stress-Free Experience
    comfort: {
      title: { type: String, default: 'Comfort & Stress-Free Experience' },
      items: [{
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        iconUrl: { type: String, default: '' }
      }]
    },

    // 8. Our Wedding Films
    weddingFilms: {
      title: { type: String, default: 'Our Wedding Films' },
      items: [{
        thumbnailUrl: { type: String, default: '' },
        videoUrl: { type: String, default: '' }
      }]
    },

    // 9. Packages
    packages: {
      title: { type: String, default: 'Our Packages' },
      subtitle: { type: String, default: 'Transparent pricing with premium deliverables tailored to capture your special day perfectly.' },
      items: [{
        title: { type: String, default: '' },
        price: { type: String, default: '' },
        features: [{ type: String }],
        isRecommended: { type: Boolean, default: false }
      }]
    },

    // 10. Final CTA
    finalCta: {
      title: { type: String, default: 'Affordable Premium Wedding Photography' },
      subtitle: { type: String, default: 'Starts From Just ₹24,999/-' },
      description: { type: String, default: 'Get professional photography, cinematic videography, creative editing, premium albums, and a dedicated team to capture your special day without exceeding your budget.' },
      backgroundImageUrl: { type: String, default: '' },
      ctaLabel: { type: String, default: 'Book Your Wedding Now' },
      ctaLink: { type: String, default: '/quote' }
    },
    
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const LandingPage = mongoose.model('LandingPage', landingPageSchema);
