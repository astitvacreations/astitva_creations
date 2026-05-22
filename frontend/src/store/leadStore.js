import { create } from 'zustand';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = `${apiBase}/leads`;

export const useLeadStore = create((set) => ({
  leads: [],
  isLoading: false,
  error: null,

  fetchLeads: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (response.ok) {
        set({ leads: data, error: null });
      } else {
        throw new Error(data.message || 'Failed to fetch leads');
      }
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addLead: async (lead) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
      const result = await response.json();
      if (response.ok) {
        set((state) => ({ leads: [result.data, ...state.leads] }));
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to submit lead inquiry');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  updateLeadStatus: async (id, status) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (response.ok) {
        set((state) => ({
          leads: state.leads.map((l) => (l._id === id ? data : l)),
        }));
        return data;
      } else {
        throw new Error(data.message || 'Failed to update lead status');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  deleteLead: async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        set((state) => ({
          leads: state.leads.filter((l) => l._id !== id),
        }));
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete lead');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
}));
