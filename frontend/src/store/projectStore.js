import { create } from 'zustand';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = `${apiBase}/projects`;

export const useProjectStore = create((set) => ({
  projects: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (response.ok) {
        set({ projects: data, error: null });
      } else {
        throw new Error(data.message || 'Failed to fetch projects');
      }
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addProject: async (project) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      const data = await response.json();
      if (response.ok) {
        set((state) => ({ projects: [...state.projects, data] }));
        return data;
      } else {
        throw new Error(data.message || 'Failed to add project');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  updateProject: async (id, updates) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (response.ok) {
        set((state) => ({
          projects: state.projects.map((p) => (p._id === id ? data : p)),
        }));
        return data;
      } else {
        throw new Error(data.message || 'Failed to update project');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  deleteProject: async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        set((state) => ({
          projects: state.projects.filter((p) => p._id !== id),
        }));
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete project');
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
}));
