// admin-frontend/src/api/pagosApi.js
import api from './axiosInstance'; // Usa la instancia configurada

const API_URL = '/pagos'; // Ya no necesitas /api porque api ya lo incluye desde baseURL

const getPagos = async (filters = {}) => {
  try {
    const { rifaId, estado, searchTerm, page = 1, limit = 10 } = filters;
    const queryParams = new URLSearchParams();

    if (rifaId) queryParams.append('rifaId', rifaId);
    if (estado) queryParams.append('estado', estado);
    if (searchTerm) queryParams.append('searchTerm', searchTerm);
    queryParams.append('page', page);
    queryParams.append('limit', limit);

    const response = await api.get(`${API_URL}?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching pagos:', error.response?.data || error.message);
    throw error;
  }
};

const getPagoById = async (id) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching pago with ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

const verifyPago = async (id, notes = '') => {
  try {
    const response = await api.patch(`${API_URL}/${id}/verificar`, { notasAdministrador: notes });
    return response.data;
  } catch (error) {
    console.error(`Error verifying pago with ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

const rejectPago = async (id, notes = '') => {
  try {
    const response = await api.patch(`${API_URL}/${id}/rechazar`, { notasAdministrador: notes });
    return response.data;
  } catch (error) {
    console.error(`Error rejecting pago with ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

const deletePago = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting pago with ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export {
  getPagos,
  getPagoById,
  verifyPago,
  rejectPago,
  deletePago
};
