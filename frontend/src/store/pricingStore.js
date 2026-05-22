import { create } from 'zustand';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const usePricingStore = create((set, get) => ({
  prices: [], // All pricing items from the DB
  loading: false,
  error: null,

  fetchPrices: async () => {
    set({ loading: true });
    try {
      const response = await fetch(`${apiBase}/pricing`);
      const data = await response.json();
      if (response.ok) {
        set({ prices: data, error: null });
      } else {
        set({ error: 'Failed to fetch prices' });
      }
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  updatePrice: async (id, updates) => {
    try {
      const response = await fetch(`${apiBase}/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      if (response.ok) {
        set((state) => {
          const exists = state.prices.some((p) => p._id === data._id);
          return {
            prices: exists
              ? state.prices.map((p) => (p._id === data._id ? data : p))
              : [...state.prices, data]
          };
        });
        return data;
      } else {
        throw new Error(data.message || 'Failed to update price');
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  deletePrice: async (id) => {
    try {
      const response = await fetch(`${apiBase}/pricing/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        set((state) => ({
          prices: state.prices.filter((p) => p._id !== id)
        }));
      }
    } catch (err) {
      console.error(err);
    }
  },

  // Helper selectors
  getEventCoveragePrices: () => {
    return get().prices.filter(p => p.category === 'Event Coverage');
  },

  getPreWeddingPrices: () => {
    return get().prices.filter(p => p.category === 'Pre-Wedding Style');
  },

  getPostProductionPrices: () => {
    return get().prices.filter(p => p.category === 'Post Production Editing');
  },

  getAlbumPrices: () => {
    return get().prices.filter(p => p.category === 'Photo Album');
  },

  getAddOnServicesPrices: () => {
    return get().prices.filter(p => p.category === 'Add-On Services');
  }
}));
