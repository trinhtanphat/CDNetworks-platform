import axios from 'axios';
import { getToken } from './auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '',
  withCredentials: true,
  timeout: 20_000,
});

api.interceptors.request.use((cfg) => {
  const token = getToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      // tránh redirect loop ngay tại trang /login
      if (!window.location.pathname.startsWith('/login')) {
        sessionStorage.removeItem('cdn_access_token');
        localStorage.removeItem('cdn_access_token');
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    return Promise.reject(err);
  },
);

export default api;
