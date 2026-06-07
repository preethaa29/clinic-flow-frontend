import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081',
});

// Request interceptor to automatically attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    try {
      const stored = localStorage.getItem('clinic_flow_user');
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch (e) {
      console.error('Failed to attach auth token to request headers', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
