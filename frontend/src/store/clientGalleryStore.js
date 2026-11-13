import { create } from 'zustand';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = `${apiBase}/client-gallery`;

export const useClientGalleryStore = create((set, get) => ({
  galleries: [],
  currentGallery: null,
  isLoading: false,
  isSyncing: false,
  error: null,

  fetchGalleries: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const query = new URLSearchParams(params).toString();
      const url = query ? `${API_URL}?${query}` : API_URL;
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        set({ galleries: data.data || [], error: null });
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch galleries');
      }
    } catch (err) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchGalleryById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/${id}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        set({ currentGallery: data.data, error: null });
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to load gallery');
      }
    } catch (err) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  createGallery: async (formData) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        set((state) => ({ galleries: [data.data, ...state.galleries] }));
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create client gallery');
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  updateGallery: async (id, updateData) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        set((state) => ({
          galleries: state.galleries.map((g) => (g._id === id ? data.data : g)),
          currentGallery: state.currentGallery?._id === id ? { ...state.currentGallery, ...data.data } : state.currentGallery
        }));
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update gallery');
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  deleteGallery: async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        set((state) => ({
          galleries: state.galleries.filter((g) => g._id !== id),
          currentGallery: state.currentGallery?._id === id ? null : state.currentGallery
        }));
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete gallery');
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  syncGallery: async (id) => {
    set({ isSyncing: true });
    try {
      const res = await fetch(`${API_URL}/${id}/sync`, {
        method: 'PUT',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        set((state) => ({
          galleries: state.galleries.map((g) => (g._id === id ? { ...g, totalPhotos: data.data.totalPhotos } : g))
        }));
        // If current gallery is open, reload it
        if (get().currentGallery?._id === id) {
          await get().fetchGalleryById(id);
        }
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to sync Google Drive folder');
      }
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      set({ isSyncing: false });
    }
  },

  reopenGallery: async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}/reopen`, {
        method: 'PUT',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        set((state) => ({
          galleries: state.galleries.map((g) => (g._id === id ? data.data : g)),
          currentGallery: state.currentGallery?._id === id ? { ...state.currentGallery, ...data.data } : state.currentGallery
        }));
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to reopen gallery');
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  sendAccessLink: async (id, channel = 'both') => {
    try {
      const res = await fetch(`${API_URL}/${id}/send-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data;
      } else {
        throw new Error(data.message || 'Failed to send access link');
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  getLightroomQuery: async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}/export-lightroom`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to export Lightroom query');
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}));

export default useClientGalleryStore;

