// admin-frontend/src/api/axiosInstance.js
import axios from 'axios';

// Crea una instancia de Axios utilizando la variable de entorno
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de peticiones para añadir token si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuestas opcional (manejo global de errores)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Token inválido o expirado.');
      // Aquí podrías redirigir al login si lo necesitas:
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
