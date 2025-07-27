// admin-frontend/src/api/rifasApi.js
import api from './axiosInstance'; // Usa la instancia de axios configurada

const API_URL = '/rifas'; // No repitas /api si ya está en VITE_API_BASE_URL

const getRifas = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching rifas:', error.response?.data || error.message);
    throw error;
  }
};

export { getRifas };
