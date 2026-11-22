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
    featureSection: {
      tagline: { type: String, default: 'WHY ASTITVA CREATIONS?' },
      title: { type: String, default: 'Candid Wedding Photographers in South India' },
      description: { 
        type: String, 
        default: "We believe that the most breathtaking memories are the ones that unfold naturally. With an artistic eye for fleeting emotions, subtle gestures, and candid laughter, Astitva Creations weaves your celebration into a timeless visual tapestry.\n\nFrom intimate rituals to majestic celebrations across South India, our team combines world-class cinematography, warm artistic tones, and unobtrusive storytelling to craft heirloom films and portraits you'll cherish for generations."
      },
      buttonText: { type: String, default: 'LEARN MORE' },
      buttonLink: { type: String, default: '/about' },
      tallImage: { 
        type: String, 
        default: 'https://res.cloudinary.com/dbvr8xzxq/image/upload/v1779472886/astitva_creations/ayb96whr4gttpbnts7kf.jpg' 
      },
      stackedImages: {
        type: [String],
        default: [
          'https://res.cloudinary.com/dbvr8xzxq/image/upload/v1779472874/astitva_creations/t9gez0dfzqpbzcwi2hs7.jpg',
          'https://res.cloudinary.com/dbvr8xzxq/image/upload/v1779472895/astitva_creations/wzzfndcc3yfmrof9xp1q.jpg',
          'https://res.cloudinary.com/dbvr8xzxq/image/upload/v1779472898/astitva_creations/qpqws0ukbndmnxvux1pa.jpg'
        ]
      }
    },
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
      },
      // Authorized receiving payment accounts
      authorizedUpiAccounts: {
        type: [{
          upiId: { type: String, required: true, trim: true },
          label: { type: String, required: true },
          bankName: { type: String, default: '' },
          isDefault: { type: Boolean, default: false },
          isActive: { type: Boolean, default: true }
        }],
        default: [
          {
            upiId: 'astitvacreations@okhdfcbank',
            label: 'Primary Current Account (HDFC)',
            bankName: 'HDFC Bank',
            isDefault: true,
            isActive: true
          },
          {
            upiId: 'astitvacreations@icici',
            label: 'Counter QR Stand (ICICI)',
            bankName: 'ICICI Bank',
            isDefault: false,
            isActive: true
          }
        ]
      },
      authorizedBankAccounts: {
        type: [{
          accountNumber: { type: String },
          ifscCode: { type: String },
          bankName: { type: String },
          accountHolder: { type: String },
          label: { type: String, default: '' }
        }],
        default: []
      }
    },
  { timestamps: true }
);

export const Setting = mongoose.model('Setting', settingSchema);
