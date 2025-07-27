// admin-frontend/src/api/ticketsApi.js
import api from './axiosInstance'; // Usa la instancia global correcta

// Consultar ticket por número y rifa
export const consultarTicketPorNumeroYRifa = async (numeroTicket, rifaId) => {
    try {
        const response = await api.get(`/tickets/consultar-por-numero/${numeroTicket}`, {
            params: { rifaId }
        });
        return response.data;
    } catch (error) {
        console.error(`Error al consultar ticket ${numeroTicket} para la rifa ${rifaId}:`, error.response?.data || error.message);
        throw error;
    }
};

// Obtener todos los tickets de una rifa
export const getTicketsByRifaId = async (rifaId) => {
    try {
        const response = await api.get(`/tickets/rifa/${rifaId}`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener tickets para la rifa ${rifaId}:`, error.response?.data || error.message);
        throw error;
    }
};

// Puedes añadir más funciones aquí si lo necesitas
