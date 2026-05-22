import { create } from 'zustand';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = `${apiBase}/landing-pages`;

export const useLandingPageStore = create((set) => ({
  pages: {},
  isLoading: false,
  error: null,

  fetchLandingPage: async (slug) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_URL}/${slug}`);
      const data = await response.json();
      if (response.ok) {
        set((state) => ({ pages: { ...state.pages, [slug]: data }, error: null }));
        return data;
      } else {
        throw new Error(data.message || 'Failed to fetch landing page');
      }
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateLandingPage: async (slug, updates) => {
    try {
      const { _id, __v, createdAt, updatedAt, ...clean } = updates;
      const response = await fetch(`${API_URL}/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clean),
      });
      const data = await response.json();
      if (response.ok) {
        set((state) => ({ pages: { ...state.pages, [slug]: data } }));
        return data;
      } else {
        throw new Error(data.message || 'Failed to update landing page');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
}));
