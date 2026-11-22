import { create } from 'zustand';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = `${apiBase}/settings`;

export const useSettingStore = create((set) => ({
  settings: {
    studioName: 'Astitva Creations',
    contactEmail: 'hello@astitvacreations.com',
    whatsappNumber: '+919505878486',
    metaPixelId: '',
    googleAnalyticsId: '',
    facebookUrl: '#',
    instagramUrl: '#',
    youtubeUrl: '#',
    isMaintenanceMode: false,
    maintenanceUntil: null,
    heroSlides: [],
    googleReviewUrl: '',
    ctaImage: '',
    featureSection: {
      tagline: 'WHY ASTITVA CREATIONS?',
      title: 'Candid Wedding Photographers in South India',
      description: "We believe that the most breathtaking memories are the ones that unfold naturally. With an artistic eye for fleeting emotions, subtle gestures, and candid laughter, Astitva Creations weaves your celebration into a timeless visual tapestry.\n\nFrom intimate rituals to majestic celebrations across South India, our team combines world-class cinematography, warm artistic tones, and unobtrusive storytelling to craft heirloom films and portraits you'll cherish for generations.",
      buttonText: 'LEARN MORE',
      buttonLink: '/about',
      tallImage: 'https://res.cloudinary.com/dbvr8xzxq/image/upload/v1779472886/astitva_creations/ayb96whr4gttpbnts7kf.jpg',
      stackedImages: [
        'https://res.cloudinary.com/dbvr8xzxq/image/upload/v1779472874/astitva_creations/t9gez0dfzqpbzcwi2hs7.jpg',
        'https://res.cloudinary.com/dbvr8xzxq/image/upload/v1779472895/astitva_creations/wzzfndcc3yfmrof9xp1q.jpg',
        'https://res.cloudinary.com/dbvr8xzxq/image/upload/v1779472898/astitva_creations/qpqws0ukbndmnxvux1pa.jpg'
      ]
    },
    serviceCategories: {
      'WEDDING': [
        'WEDDING', 'ENGAGEMENT', 'HALDI', 'MEHENDI', 'SANGEET', 
        'PELLIKODUKU', 'PELLIKUTURU', 'GODUMRAI', 'RECEPTION', 
        'VRATHAM', 'COCKTAIL PARTY'
      ],
      'HALF SAREE': [
        'HALF SAREE CEREMONY', 'HALDI', 'MEHENDI', 'RECEPTION'
      ],
      'BABY SHOOT': [
        'PRE BABY SHOOT', 'POST BABY SHOOT', 'BABY SHOWER', 'FIRST BIRTHDAY'
      ]
    },
    standardServices: [
      'Traditional Photography',
      'Candid Photography',
      'Traditional Videography',
      'Cinematic Video',
      'Drone',
      'FPV Drone',
      '360° VR Coverage'
    ]
  },
  isLoading: false,
  error: null,
  initialized: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (response.ok) {
        set({ settings: data, error: null, initialized: true });
      } else {
        throw new Error(data.message || 'Failed to fetch settings');
      }
    } catch (error) {
      set({ error: error.message, initialized: true });
    } finally {
      set({ isLoading: false });
    }
  },

  updateSettings: async (updates) => {
    try {
      // Strip metadata fields that shouldn't be sent in the body
      const { _id, __v, createdAt, updatedAt, ...cleanUpdates } = updates;
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanUpdates),
      });
      const data = await response.json();
      if (response.ok) {
        set({ settings: data });
        return data;
      } else {
        throw new Error(data.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
}));
