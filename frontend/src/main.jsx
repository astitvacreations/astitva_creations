import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'

const apiBase = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : 'https://astitva-creations.onrender.com/api');

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  
  if (
    typeof resource === 'string' &&
    (resource.startsWith(apiBase) || resource.includes('/api/'))
  ) {
    const stateStr = localStorage.getItem('auth-storage');
    if (stateStr) {
      try {
        const state = JSON.parse(stateStr).state;
        if (state && state.token) {
          config = config || {};
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${state.token}`
          };
          args[1] = config;
        }
      } catch(e) {}
    }
  }
  return originalFetch(...args);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);

// Auto-reload on Vite dynamic import chunk failures (e.g. after new deployments or network glitches)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error encountered; auto-reloading to fetch fresh chunks...', event);
  window.location.reload();
});

// Clear any stale service workers and old caches to prevent chunk mismatch and multi-refresh loops
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  }).catch((err) => console.warn('Error unregistering service worker:', err));

  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name);
      }
    }).catch((err) => console.warn('Error deleting caches:', err));
  }
}


