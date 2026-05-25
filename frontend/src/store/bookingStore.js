import { create } from 'zustand';

const apiBase = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : 'https://astitva-creations.onrender.com/api');
const API_URL = `${apiBase}/bookings`;

export const useBookingStore = create((set) => ({
  bookings: [],
  isLoading: false,
  error: null,

  fetchBookings: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (response.ok) {
        set({ bookings: data, error: null });
      } else {
        throw new Error(data.message || 'Failed to fetch bookings');
      }
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addBooking: async (booking) => {
    try {
      const response = await fetch(`${API_URL}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
      });
      const result = await response.json();
      if (response.ok) {
        set((state) => ({ bookings: [result.data, ...state.bookings] }));
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to submit quote request');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  updateBookingStatus: async (id, status) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (response.ok) {
        set((state) => ({
          bookings: state.bookings.map((b) => (b._id === id ? data : b)),
        }));
        return data;
      } else {
        throw new Error(data.message || 'Failed to update booking status');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  applyDiscount: async (id, discountType, discountValue) => {
    try {
      const response = await fetch(`${API_URL}/${id}/discount`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discountType, discountValue }),
      });
      const data = await response.json();
      if (response.ok) {
        set((state) => ({
          bookings: state.bookings.map((b) => (b._id === id ? data.data : b)),
        }));
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to apply discount');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  deleteBooking: async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        set((state) => ({
          bookings: state.bookings.filter((b) => b._id !== id),
        }));
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete booking');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  updateBooking: async (id, updatedFields) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      const data = await response.json();
      if (response.ok) {
        set((state) => ({
          bookings: state.bookings.map((b) => (b._id === id ? data.data : b)),
        }));
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update booking');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
}));
