import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global fetch interceptor for auth
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;

  let url = '';
  if (typeof resource === 'string') {
    url = resource;
  } else if (resource instanceof URL) {
    url = resource.toString();
  } else if (resource instanceof Request) {
    url = resource.url;
  }



  try {
    const response = await originalFetch(resource, config);

    if (response.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return response;
  } catch (error) {
    throw error;
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
