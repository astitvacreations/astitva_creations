import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const useAuthStore = create(persist((set) => ({
  admin: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (adminData, token) => set({ admin: adminData, token: token, isAuthenticated: true, isLoading: false }),
  clearAuth: () => set({ admin: null, token: null, isAuthenticated: false, isLoading: false }),
  setLoading: (status) => set({ isLoading: status }),

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch(`${apiBase}/auth/me?_t=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        set({ admin: data.data, isAuthenticated: true, isLoading: false });
      } else {
        set({ admin: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({ admin: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await fetch(`${apiBase}/auth/logout`, { 
        method: 'POST',
        credentials: 'include'
      });
      set({ admin: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}), {
  name: 'auth-storage',
  partialize: (state) => ({ admin: state.admin, token: state.token, isAuthenticated: state.isAuthenticated }),
}));

export default useAuthStore;
