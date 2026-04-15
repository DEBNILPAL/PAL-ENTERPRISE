import axios from 'axios';

// In production (Netlify), VITE_API_URL points to the Render backend
// In development, Vite proxies /api to localhost:5000
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const API = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('pal_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      // Only auto-logout on protected routes (not login)
      const isAuthRoute = err.config?.url?.includes('/login') || err.config?.url?.includes('/signup');
      if (!isAuthRoute) {
        localStorage.removeItem('pal_token');
        localStorage.removeItem('pal_user');
        window.location.href = '/';
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const signup = (data) => API.post('/signup', data);
export const login = (data) => API.post('/login', data);

// Transactions
export const addEntry = (data) => API.post('/add-entry', data);
export const addPayment = (data) => API.post('/add-payment', data);
export const confirmPayment = (data) => API.post('/add-payment/confirm', data);
export const getTransactions = (dlNumber) => API.get(`/transactions/${dlNumber}`);
export const getSummary = (dlNumber) => API.get(`/summary/${dlNumber}`);

export default API;
