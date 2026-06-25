import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  
  if (typeof resource === 'string' && resource.startsWith(apiBase)) {
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
)
