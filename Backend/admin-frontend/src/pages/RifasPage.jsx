// admin-frontend/src/pages/RifasPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance'; // Asegúrate de que la ruta sea correcta
import { FaArrowLeft, FaHome, FaSpinner, FaTimesCircle, FaCheckCircle, FaEdit, FaTrashAlt } from 'react-icons/fa'; // Importamos FaEdit y FaTrashAlt

// Componente de Toast (simulado, puedes reemplazarlo por una librería real como react-toastify)
const showToast = (message, type = 'info') => {
    console.log(`[Toast ${type.toUpperCase()}]: ${message}`);
    // Implementa aquí tu lógica real de Toast
};

// Componente ToggleSwitch para el control manual
const ToggleSwitch = ({ id, checked, onChange, label }) => (
    <div className="toggle-switch-container">
        <input
            type="checkbox"
            id={id}
            checked={checked}
            onChange={onChange}
            className="toggle-switch-checkbox"
        />
        <label htmlFor={id} className="toggle-switch-label">
            <span className="toggle-switch-inner" data-yes="Abierta" data-no="Cerrada"></span>
            <span className="toggle-switch-switch"></span>
        </label>
        {label && <span className="toggle-switch-text">{label}</span>}
    </div>
);


function RifasPage() {
    const [rifas, setRifas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedRifa, setSelectedRifa] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [formData, setFormData] = useState({
        nombreProducto: '',
        descripcion: '',
        imagenUrl: '',
        precioTicketUSD: '',
        tasaCambio: '',
        totalTickets: '',
        fechaInicioSorteo: '',
        fechaFin: '',
        fechaSorteo: '',
        estaAbiertaParaVenta: true, // Añadir al formData para creación/edición
    });

    useEffect(() => {
        fetchRifas();
    }, []);

    const fetchRifas = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('adminToken');
            const response = await api.get('/rifas', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setRifas(response.data);
        } catch (err) {
            console.error('Error al obtener rifas:', err);
            setError('No se pudieron cargar las rifas. Inténtalo de nuevo más tarde.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevData) => {
            let parsedValue = value;

            if (name === 'precioTicketUSD' || name === 'tasaCambio') {
                parsedValue = value === '' ? '' : parseFloat(value);
            } else if (name === 'totalTickets') {
                parsedValue = value === '' ? '' : parseInt(value, 10);
            } else if (name === 'estaAbiertaParaVenta') {
                parsedValue = checked;
            }
            
            return {
                ...prevData,
                [name]: parsedValue,
            };
        });
    };

    const formatDatesForBackend = (data) => {
        const newData = { ...data };
        if (newData.fechaInicioSorteo) {
            newData.fechaInicioSorteo = new Date(newData.fechaInicioSorteo).toISOString();
        }
        if (newData.fechaFin) {
            newData.fechaFin = new Date(newData.fechaFin).toISOString();
        }
        if (newData.fechaSorteo) {
            if (newData.fechaSorteo !== '') {
                newData.fechaSorteo = new Date(newData.fechaSorteo).toISOString();
            } else {
                delete newData.fechaSorteo; 
            }
        }
        return newData;
    };

    const formatNumbersForBackend = (data) => {
        const newData = { ...data };
        if (typeof newData.precioTicketUSD === 'string' && newData.precioTicketUSD !== '') {
            newData.precioTicketUSD = parseFloat(newData.precioTicketUSD);
        } else if (newData.precioTicketUSD === '') {
            delete newData.precioTicketUSD; 
        }
        
        if (typeof newData.tasaCambio === 'string' && newData.tasaCambio !== '') {
            newData.tasaCambio = parseFloat(newData.tasaCambio);
        } else if (newData.tasaCambio === '') {
            delete newData.tasaCambio;
        }

        if (typeof newData.totalTickets === 'string' && newData.totalTickets !== '') {
            newData.totalTickets = parseInt(newData.totalTickets, 10);
        } else if (newData.totalTickets === '') {
            delete newData.totalTickets;
        }

        return newData;
    };


    const handleCreateRifa = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = localStorage.getItem('adminToken');
            let dataToSend = formatNumbersForBackend(formData); 
            dataToSend = formatDatesForBackend(dataToSend); 
            
            const response = await api.post('/rifas', dataToSend, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            showToast('Rifa creada exitosamente!', 'success');
            setIsFormOpen(false);
            setFormData({
                nombreProducto: '', descripcion: '', imagenUrl: '', precioTicketUSD: '', tasaCambio: '', totalTickets: '',
                fechaInicioSorteo: '', fechaFin: '', fechaSorteo: '', estaAbiertaParaVenta: true
            });
            fetchRifas();
        } catch (err) {
            console.error('Error al crear rifa:', err.response?.data || err);
            setError(err.response?.data?.message || 'Error al crear la rifa. Asegúrate de que todos los campos requeridos estén llenos y sean válidos.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditRifa = (rifa) => {
        setSelectedRifa(rifa);
        const formattedFechaFin = rifa.fechaFin ? new Date(rifa.fechaFin).toISOString().slice(0, 16) : '';
        const formattedFechaSorteo = rifa.fechaSorteo ? new Date(rifa.fechaSorteo).toISOString().slice(0, 16) : '';
        const formattedFechaInicioSorteo = rifa.fechaInicioSorteo ? new Date(rifa.fechaInicioSorteo).toISOString().slice(0, 10) : '';

        setFormData({
            nombreProducto: rifa.nombreProducto,
            descripcion: rifa.descripcion,
            imagenUrl: rifa.imagenUrl,
            precioTicketUSD: rifa.precioTicketUSD, 
            tasaCambio: rifa.tasaCambio,
            totalTickets: rifa.totalTickets,
            fechaInicioSorteo: formattedFechaInicioSorteo,
            fechaFin: formattedFechaFin,
            fechaSorteo: formattedFechaSorteo,
            estaAbiertaParaVenta: rifa.estaAbiertaParaVenta, // Cargar el estado manual
        });
        setIsFormOpen(true);
    };

    const handleUpdateRifa = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = localStorage.getItem('adminToken');
            let dataToSend = formatNumbersForBackend(formData);
            dataToSend = formatDatesForBackend(dataToSend);

            const response = await api.patch(`/rifas/${selectedRifa._id}`, dataToSend, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            showToast('Rifa actualizada exitosamente!', 'success');
            setIsFormOpen(false);
            setSelectedRifa(null);
            setFormData({
                nombreProducto: '', descripcion: '', imagenUrl: '', precioTicketUSD: '', tasaCambio: '', totalTickets: '',
                fechaInicioSorteo: '', fechaFin: '', fechaSorteo: '', estaAbiertaParaVenta: true
            });
            fetchRifas();
        } catch (err) {
            console.error('Error al actualizar rifa:', err.response?.data || err);
            setError(err.response?.data?.message || 'Error al actualizar la rifa. Asegúrate de que todos los campos requeridos estén llenos y sean válidos.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRifa = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta rifa? Esta acción es irreversible.')) {
            return;
        }
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('adminToken');
            const response = await api.delete(`/rifas/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            showToast('Rifa eliminada exitosamente!', 'success');
            fetchRifas();
        } catch (err) {
            console.error('Error al eliminar rifa:', err);
            setError(err.response?.data?.message || 'Error al eliminar la rifa.');
        } finally {
            setLoading(false);
        }
    };

    const handleSortearRifa = async (rifaId) => {
        if (!window.confirm('¿Estás seguro de que quieres sortear esta rifa? Esta acción es irreversible y seleccionará al ganador.')) {
            return;
        }
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('adminToken');
            const response = await api.post(`/rifas/${rifaId}/sortear`, {
                numberOfWinners: { "primer_lugar": 1 }
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            showToast('Rifa sorteada exitosamente! Ganador: ' + response.data.ganadores[0]?.nombreGanador, 'success');
            fetchRifas();
        } catch (err) {
            console.error('Error al sortear rifa:', err);
            setError(err.response?.data?.message || 'Error al sortear la rifa.');
        } finally {
            setLoading(false);
        }
    };

    // ¡NUEVA FUNCIÓN! Para cambiar el estado manual de venta
    const handleToggleVentaManual = async (rifaId, currentStatus) => {
        const newStatus = !currentStatus;
        if (!window.confirm(`¿Estás seguro de que quieres ${newStatus ? 'ABRIR' : 'CERRAR'} esta rifa para la venta manual?`)) {
            return;
        }
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('adminToken');
            await api.patch(`/rifas/${rifaId}/toggle-venta-manual`, {
                estaAbiertaParaVenta: newStatus
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            showToast(`Rifa ${newStatus ? 'abierta' : 'cerrada'} manualmente para la venta.`, 'success');
            fetchRifas(); // Recargar la lista para ver el cambio
        } catch (err) {
            console.error('Error al cambiar estado manual de venta:', err);
            setError(err.response?.data?.message || 'Error al cambiar el estado manual de venta de la rifa.');
        } finally {
            setLoading(false);
        }
    };


    const handleGoBack = () => {
        window.history.back();
    };

    const handleGoToDashboard = () => {
        window.location.href = '/dashboard';
    };

    if (loading) {
        return <div className="loading-screen"><FaSpinner className="loading-spinner" /><p className="loading-text">Cargando rifas...</p></div>;
    }

    if (error) {
        return (
            <div className="error-screen">
                <FaTimesCircle className="error-icon" />
                <h1 className="error-title">¡Oops! Error al Cargar Rifas</h1>
                <p className="error-message">{error}</p>
                <button onClick={fetchRifas} className="action-button reload">
                    <FaSpinner /> Reintentar Carga
                </button>
                <button onClick={handleGoToDashboard} className="action-button login mt-4">
                    <FaArrowLeft /> Ir al Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="rifas-page-container">
            <div className="rifas-header">
                <div className="header-buttons">
                    <button onClick={handleGoBack} className="btn-navegacion">
                        <FaArrowLeft /> Volver Atrás
                    </button>
                    <button onClick={handleGoToDashboard} className="btn-navegacion btn-dashboard">
                        <FaHome /> Dashboard
                    </button>
                </div>
                <h2>Gestión de Rifas</h2>
            </div>

            {error && <p className="error-message">{error}</p>}
            {loading && <p className="loading-message">Cargando rifas...</p>}

            {!isFormOpen && (
                <button onClick={() => {
                        setIsFormOpen(true);
                        setSelectedRifa(null);
                        setFormData({
                            nombreProducto: '', descripcion: '', imagenUrl: '', precioTicketUSD: '', tasaCambio: '', totalTickets: '',
                            fechaInicioSorteo: '', fechaFin: '', fechaSorteo: '', estaAbiertaParaVenta: true
                        });
                    }} className="add-button">
                    Crear Nueva Rifa
                </button>
            )}

            {isFormOpen && (
                <div className="form-container">
                    <h3>{selectedRifa ? 'Editar Rifa' : 'Crear Nueva Rifa'}</h3>
                    <form onSubmit={selectedRifa ? handleUpdateRifa : handleCreateRifa}>
                        <div className="form-group">
                            <label htmlFor="nombreProducto">Nombre del Producto:</label>
                            <input
                                type="text"
                                id="nombreProducto"
                                name="nombreProducto"
                                value={formData.nombreProducto}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="descripcion">Descripción:</label>
                            <textarea
                                id="descripcion"
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleInputChange}
                                required
                            ></textarea>
                        </div>
                        <div className="form-group">
                            <label htmlFor="imagenUrl">URL de la Imagen:</label>
                            <input
                                type="text"
                                id="imagenUrl"
                                name="imagenUrl"
                                value={formData.imagenUrl}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="precioTicketUSD">Precio Ticket (USD):</label>
                            <input
                                type="number"
                                id="precioTicketUSD"
                                name="precioTicketUSD"
                                value={formData.precioTicketUSD}
                                onChange={handleInputChange}
                                step="0.01"
                                min="0.01"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="tasaCambio">Tasa de Cambio (VES por USD):</label>
                            <input
                                type="number"
                                id="tasaCambio"
                                name="tasaCambio"
                                value={formData.tasaCambio}
                                onChange={handleInputChange}
                                step="0.01"
                                min="0.01"
                                required
                            />
                        </div>
                        {formData.precioTicketUSD !== '' && formData.tasaCambio !== '' && !isNaN(formData.precioTicketUSD) && !isNaN(formData.tasaCambio) && (
                            <p className="calculated-price">
                                Precio en Bolívares (Calculado): <strong>VES {(parseFloat(formData.precioTicketUSD) * parseFloat(formData.tasaCambio)).toFixed(2)}</strong>
                            </p>
                        )}
                        <div className="form-group">
                            <label htmlFor="totalTickets">Total de Tickets:</label>
                            <input
                                type="number"
                                id="totalTickets"
                                name="totalTickets"
                                value={formData.totalTickets}
                                onChange={handleInputChange}
                                min="1"
                                required
                            />
                        </div>

                        {/* Control para el estado manual de venta */}
                        <div className="form-group">
                            <ToggleSwitch
                                id="estaAbiertaParaVenta"
                                name="estaAbiertaParaVenta"
                                checked={formData.estaAbiertaParaVenta}
                                onChange={handleInputChange}
                                label="Abierta para Venta Manual"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="fechaInicioSorteo">Fecha de Inicio del Sorteo:</label>
                            <input
                                type="date"
                                id="fechaInicioSorteo"
                                name="fechaInicioSorteo"
                                value={formData.fechaInicioSorteo}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="fechaFin">Fecha de Finalización (y Hora):</label>
                            <input
                                type="datetime-local"
                                id="fechaFin"
                                name="fechaFin"
                                value={formData.fechaFin}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="fechaSorteo">Fecha y Hora del Sorteo:</label>
                            <input
                                type="datetime-local"
                                id="fechaSorteo"
                                name="fechaSorteo"
                                value={formData.fechaSorteo}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" disabled={loading}>
                                {loading ? 'Guardando...' : (selectedRifa ? 'Actualizar Rifa' : 'Crear Rifa')}
                            </button>
                            <button type="button" onClick={() => { setIsFormOpen(false); setSelectedRifa(null); setError(''); }} className="cancel-button">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!loading && !error && !isFormOpen && rifas.length > 0 && (
                <div className="rifas-list">
                    <h3>Rifas Existentes</h3>
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Tickets Vendidos</th>
                                    <th>Total Tickets</th>
                                    <th>% Vendido</th>
                                    <th>Precio (USD)</th>
                                    <th>Precio (VES)</th>
                                    <th>Fecha Inicio</th>
                                    <th>Fecha Fin Venta</th>
                                    <th>Fecha Sorteo</th>
                                    <th>Estado General</th>
                                    <th>Acciones</th> {/* Solo una columna de acciones */}
                                </tr>
                            </thead>
                            <tbody>
                                {rifas.map((rifa) => (
                                    <tr key={rifa._id}>
                                        <td>{rifa.nombreProducto}</td>
                                        <td>{rifa.ticketsVendidos}</td>
                                        <td>{rifa.totalTickets}</td>
                                        <td>{rifa.porcentajeVendido ? rifa.porcentajeVendido.toFixed(2) : '0.00'}%</td>
                                        <td>${typeof rifa.precioTicketUSD === 'number' ? rifa.precioTicketUSD.toFixed(2) : 'N/A'}</td>
                                        <td>VES {typeof rifa.precioTicketVES === 'number' ? rifa.precioTicketVES.toFixed(2) : 'N/A'}</td>
                                        <td>{rifa.fechaInicioSorteo ? new Date(rifa.fechaInicioSorteo).toLocaleDateString('es-VE') : 'N/A'}</td>
                                        <td>{rifa.fechaFin ? new Date(rifa.fechaFin).toLocaleString('es-VE') : 'N/A'}</td>
                                        <td>{rifa.fechaSorteo ? new Date(rifa.fechaSorteo).toLocaleString('es-VE') : 'Pendiente'}</td>
                                        <td>
                                            <span className={`status-badge status-${rifa.estado}`}>
                                                {rifa.estado.charAt(0).toUpperCase() + rifa.estado.slice(1)}
                                            </span>
                                        </td>
                                        {/* ¡COLUMNA DE ACCIONES CONSOLIDADA! */}
                                        <td className="actions-cell">
                                            {/* Toggle Switch para el estado manual de venta */}
                                            <ToggleSwitch
                                                id={`toggle-${rifa._id}`}
                                                checked={rifa.estaAbiertaParaVenta}
                                                onChange={() => handleToggleVentaManual(rifa._id, rifa.estaAbiertaParaVenta)}
                                                // No hay 'label' aquí, el texto se mostrará con CSS si es necesario
                                            />
                                            {/* Botones de acción existentes */}
                                            <button onClick={() => handleEditRifa(rifa)} className="action-button edit-button" title="Editar Rifa"><FaEdit /></button>
                                            <button onClick={() => handleDeleteRifa(rifa._id)} className="action-button delete-button" title="Eliminar Rifa"><FaTrashAlt /></button>
                                            {!rifa.sorteada && rifa.ticketsVendidos > 0 && (
                                                <button onClick={() => handleSortearRifa(rifa._id)} className="action-button sortear-button" title="Sortear Rifa"><FaSpinner /></button>
                                            )}
                                            {rifa.sorteada && rifa.ganadores && rifa.ganadores.length > 0 && (
                                                <span className="winner-info">Ganador: {rifa.ganadores[0]?.nombreGanador || 'N/A'}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!loading && !error && !isFormOpen && rifas.length === 0 && (
                <p className="no-rifas-message">No hay rifas para mostrar. ¡Crea una nueva!</p>
            )}
        </div>
    );
}

export default RifasPage;
