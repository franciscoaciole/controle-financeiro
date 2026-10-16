import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// O AuthContext registra aqui o que fazer quando a sessão expira.
let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register');

    // 401 fora das telas de login/cadastro: o token expirou ou é inválido
    if (status === 401 && !isAuthRoute && onUnauthorized) {
      onUnauthorized();
    }

    return Promise.reject(error);
  }
);

export default api;
