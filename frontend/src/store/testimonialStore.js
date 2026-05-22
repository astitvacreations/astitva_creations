import { create } from 'zustand';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = `${apiBase}/testimonials`;

export const useTestimonialStore = create((set) => ({
  testimonials: [],
  isLoading: false,
  error: null,

  fetchTestimonials: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (response.ok) {
        set({ testimonials: data, error: null });
      } else {
        throw new Error(data.message || 'Failed to fetch testimonials');
      }
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addTestimonial: async (testimonial) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testimonial),
      });
      const data = await response.json();
      if (response.ok) {
        set((state) => ({ testimonials: [...state.testimonials, data] }));
        return data;
      } else {
        throw new Error(data.message || 'Failed to add testimonial');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  updateTestimonial: async (id, updates) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (response.ok) {
        set((state) => ({
          testimonials: state.testimonials.map((t) => (t._id === id ? data : t)),
        }));
        return data;
      } else {
        throw new Error(data.message || 'Failed to update testimonial');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  deleteTestimonial: async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        set((state) => ({
          testimonials: state.testimonials.filter((t) => t._id !== id),
        }));
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete testimonial');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
}));
