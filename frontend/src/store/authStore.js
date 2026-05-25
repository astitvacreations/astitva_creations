import { create } from 'zustand';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const useAuthStore = create((set) => ({
  admin: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (adminData) => set({ admin: adminData, isAuthenticated: true, isLoading: false }),
  clearAuth: () => set({ admin: null, isAuthenticated: false, isLoading: false }),
  setLoading: (status) => set({ isLoading: status }),

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch(`${apiBase}/auth/me`, {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        set({ admin: data.data, isAuthenticated: true, isLoading: false });
      } else {
        set({ admin: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({ admin: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      set({ admin: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}));

export default useAuthStore;
