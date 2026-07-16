import mongoose from 'mongoose';

const heroSlideSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  mobileImageUrl: { type: String, default: '' },
  caption: { type: String, default: '' },
  description: { type: String, default: '' },
  position: { type: String, default: '50% 50%' },
  mobilePosition: { type: String, default: '50% 50%' },
}, { _id: false });

const settingSchema = new mongoose.Schema(
  {
    studioName: { type: String, default: 'Astitva Creations' },
    contactEmail: { type: String, default: 'hello@astitvacreations.com' },
    whatsappNumber: { type: String, default: '+919505878486' },
    heroMainCaption: { type: String, default: 'Capturing Timeless Elegance' },
    heroMainDescription: { type: String, default: 'Your Story,\nTold Cinematically.' },
    metaPixelId: { type: String, default: '' },
    googleAnalyticsId: { type: String, default: '' },
    facebookUrl: { type: String, default: '#' },
    instagramUrl: { type: String, default: '#' },
    youtubeUrl: { type: String, default: '#' },
    isMaintenanceMode: { type: Boolean, default: false },
    maintenanceUntil: { type: Date },
    heroSlides: { type: [heroSlideSchema], default: [] },
    googleReviewUrl: { type: String, default: '' },
    ownerImage: { type: String, default: '' },
    ctaImage: { type: String, default: '' },
    serviceCategories: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        'WEDDING': [
          'WEDDING', 'ENGAGEMENT', 'HALDI', 'MEHENDI', 'SANGEET', 
          'PELLIKODUKU', 'PELLIKUTURU', 'GODUMRAI', 'RECEPTION', 
          'VRATHAM', 'COCKTAIL PARTY'
        ],
        'BABY BUMP': ['MATERNITY', 'BABY SHOWER'],
        'KIDS PORTRAITS': ['NEW BORN', 'SITTER', 'TODDLER', 'CAKE SMASH', 'BIRTHDAY', 'DHOTI / SAREE CEREMONY', 'ANNAPRASHAN / THOTTILA'],
        'CELEBRATIONS': ['HOUSE WARMING', 'NAMAKARANA', 'SHASTIPOORTHI'],
        'OTHERS': ['CORPORATE / BRANDING', 'FASHION PORTFOLIO']
      }
    },
      standardServices: {
        type: [String],
        default: [
          'Traditional Photography',
          'Candid Photography',
          'Traditional Videography',
          'Cinematic Video',
          'Drone',
          'FPV Drone',
          '360° VR Coverage'
        ]
      },
      contestActive: { type: Boolean, default: false },
      contestOverrides: [
        {
          source: { type: String },
          content: { type: String }
        }
      ],
      showQuoteWidgets: { type: Boolean, default: true },
      progressTrackingOptions: { 
        type: [String], 
        default: ['SHOOT COMPLETED', 'PHOTOS DELIVERED', 'VIDEOS DELIVERED'] 
      }
    },
  { timestamps: true }
);

export const Setting = mongoose.model('Setting', settingSchema);
