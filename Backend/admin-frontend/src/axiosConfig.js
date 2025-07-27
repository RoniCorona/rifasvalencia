// src/utils/axiosConfig.js
import axios from 'axios';

// ✅ Establece la URL base usando la variable de entorno VITE_API_BASE_URL
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

// ✅ Interceptor de peticiones para añadir el token si existe
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Interceptor de respuestas (opcional) para manejo global de errores
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Petición no autorizada (401). Token inválido o expirado.');
      // Puedes implementar lógica de redirección aquí si lo deseas
    }
    return Promise.reject(error);
  }
);

export default axios;
