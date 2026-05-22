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
