import { create } from 'zustand';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = `${apiBase}/services`;

export const useServiceStore = create((set, get) => ({
  services: [],
  isLoading: false,
  error: null,

  fetchServices: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (response.ok) {
        set({ services: data, error: null });
      } else {
        throw new Error(data.message || 'Failed to fetch services');
      }
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addService: async (service) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service),
      });
      const data = await response.json();
      if (response.ok) {
        set((state) => ({ services: [...state.services, data] }));
        return data;
      } else {
        throw new Error(data.message || 'Failed to add service');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  updateService: async (id, updates) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (response.ok) {
        set((state) => ({
          services: state.services.map((s) => (s._id === id ? data : s)),
        }));
        return data;
      } else {
        throw new Error(data.message || 'Failed to update service');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  deleteService: async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        set((state) => ({
          services: state.services.filter((s) => s._id !== id),
        }));
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete service');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
}));
