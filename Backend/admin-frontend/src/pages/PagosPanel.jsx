// admin-frontend/src/pages/PagosPanel.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// Importa la instancia de axios configurada
import { getPagos, verifyPago, rejectPago, deletePago } from '../api/pagosApi';
import { getRifas } from '../api/rifasApi';
import { consultarTicketPorNumeroYRifa } from '../api/ticketsApi';

import { FaFilter, FaSearch, FaDollarSign, FaFileInvoiceDollar, FaArrowLeft, FaSpinner, FaTimesCircle, FaCheckCircle, FaTrash } from 'react-icons/fa';

import './PagosPanel.css'; // Importa los estilos CSS específicos para esta página
import axios from 'axios';

// Función de utilidad para mostrar un Toast (puedes reemplazarla por una librería real)
const showToast = (message, type = 'info') => {
    console.log(`[Toast ${type.toUpperCase()}]: ${message}`);
    // Implementa aquí tu lógica real de Toast (ej. con react-toastify o un componente custom)
    // Por ejemplo:
    // if (type === 'success') toast.success(message);
    // else if (type === 'error') toast.error(message);
    // else toast.info(message);
};

const PagosPanel = () => {
    const [pagos, setPagos] = useState([]);
    const [rifas, setRifas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState({
        rifaId: '',
        estado: '',
        searchTerm: '',
        page: 1,
        limit: 10
    });
    const [totalPagos, setTotalPagos] = useState(0);

    const [isTicketQueryOpen, setIsTicketQueryOpen] = useState(false);
    const [ticketNumber, setTicketNumber] = useState('');
    const [selectedRifaIdForTicketQuery, setSelectedRifaIdForTicketQuery] = useState(''); 
    const [ticketQueryResult, setTicketQueryResult] = useState(null);
    const [ticketQueryError, setTicketQueryError] = useState('');
    const [ticketQueryLoading, setTicketQueryLoading] = useState(false);

    // Función para obtener pagos y rifas
    const fetchPagosAndRifas = async () => {
        try {
            setLoading(true);
            setError(null); // Limpiar errores antes de una nueva carga

            const rifasData = await getRifas();
            setRifas(rifasData);

            const pagosData = await getPagos(filters);
            setPagos(pagosData.pagos);
            setTotalPagos(pagosData.total);
        } catch (err) {
            setError('Error al cargar los pagos o rifas: ' + (err.response?.data?.message || err.message));
            console.error('Error fetching pagos and rifas:', err);
        } finally {
            setLoading(false);
        }
    };

    // useEffect para cargar pagos y rifas cuando los filtros cambian
    useEffect(() => {
        fetchPagosAndRifas();
    }, [filters]);

    // Manejadores de cambios en los filtros
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({ ...prevFilters, [name]: value, page: 1 }));
    };

    // Manejador de cambio de página
    const handlePageChange = (newPage) => {
        setFilters(prevFilters => ({ ...prevFilters, page: newPage }));
    };

    // Manejador para verificar un pago
    const handleVerifyPago = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres VERIFICAR este pago?')) {
            const notes = prompt('Añade una nota de administrador (opcional):');
            try {
                await verifyPago(id, notes);
                await fetchPagosAndRifas(); // Recargar datos después de la acción
                showToast('Pago verificado exitosamente.', 'success'); 
            } catch (err) {
                showToast('Error al verificar el pago: ' + (err.response?.data?.message || err.message), 'error'); 
                console.error(err);
            }
        }
    };

    // Manejador para rechazar un pago
    const handleRejectPago = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres RECHAZAR este pago? Los tickets serán liberados.')) {
            const notes = prompt('Añade una nota de administrador (obligatorio para rechazar):');
            if (!notes) {
                showToast('La nota de administrador es obligatoria para rechazar un pago.', 'warning'); 
                return;
            }
            try {
                await rejectPago(id, notes);
                await fetchPagosAndRifas(); // Recargar datos después de la acción
                showToast('Pago rechazado exitosamente. Tickets liberados.', 'success'); 
            } catch (err) {
                showToast('Error al rechazar el pago: ' + (err.response?.data?.message || err.message), 'error'); 
                console.error(err);
            }
        }
    };

    // Manejador para eliminar un pago
    const handleDeletePago = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres ELIMINAR este pago? Esta acción es irreversible y podría liberar tickets.')) {
            try {
                await deletePago(id);
                await fetchPagosAndRifas(); // Recargar datos después de la acción
                showToast('Pago eliminado exitosamente.', 'success'); 
            }
            catch (err) {
                showToast('Error al eliminar el pago: ' + (err.response?.data?.message || err.message), 'error'); 
                console.error(err);
            }
        }
    };

    // Manejador para consultar un ticket por número y rifa
    const handleTicketQuery = async () => {
        setTicketQueryError('');
        setTicketQueryResult(null);
        if (!ticketNumber) {
            setTicketQueryError('Por favor, ingresa un número de ticket.');
            return;
        }
        if (!selectedRifaIdForTicketQuery) {
            setTicketQueryError('Por favor, selecciona una rifa.');
            return;
        }

        // VALIDACIÓN ACTUALIZADA: El número de ticket debe ser numérico y tener entre 1 y 4 dígitos (para 0000-9999)
        if (!/^\d{1,4}$/.test(ticketNumber)) { 
            setTicketQueryError('El número de ticket debe ser numérico y tener entre 1 y 4 dígitos (ej. 0000, 42, 1234, 9999).'); // Placeholder actualizado
            return;
        }

        setTicketQueryLoading(true);
        try {
            // Formatea a 4 dígitos, ej. '0042' o '0000'
            const formattedTicketNumber = String(ticketNumber).padStart(4, '0');
            
            const response = await consultarTicketPorNumeroYRifa(formattedTicketNumber, selectedRifaIdForTicketQuery);
            setTicketQueryResult(response.ticket);
        } catch (err) {
            console.error('Error al consultar ticket:', err);
            setTicketQueryError(err.response?.data?.message || 'Ticket no encontrado o error en la consulta.');
        } finally {
            setTicketQueryLoading(false);
        }
    };

    // Renderizado condicional mientras carga
    if (loading) {
        return (
            <div className="loading-screen">
                <FaSpinner className="loading-spinner" />
                <p className="loading-text">Cargando pagos...</p>
            </div>
        );
    }

    // Renderizado condicional si hay error
    if (error) {
        return (
            <div className="error-screen">
                <FaTimesCircle className="error-icon" />
                <h1 className="error-title">¡Oops! Error al Cargar Pagos</h1>
                <p className="error-message">{error}</p>
                <Link to="/dashboard" className="action-button login">
                    <FaArrowLeft /> Volver al Dashboard
                </Link>
            </div>
        );
    }

    // Cálculo del total de páginas para la paginación
    const totalPages = Math.ceil(totalPagos / filters.limit);

    return (
        <div className="payments-panel-container">
            <div className="payments-panel-content-wrapper"> {/* Nuevo contenedor para centrar y limitar ancho */}

                <header className="payments-header">
                    <h1 className="payments-title">Gestión de <span>Pagos</span> <FaFileInvoiceDollar /></h1>
                    <p className="payments-subtitle">Administra y verifica todas las transacciones de tus rifas.</p>
                    <div className="header-buttons">
                        <Link to="/dashboard" className="header-btn back-to-dashboard">
                            <FaArrowLeft /> Volver al Dashboard
                        </Link>
                    </div>
                </header>

                {/* Sección de Consulta de Ticket */}
                <section className="section-card-container ticket-query-section">
                    <div className="section-header">
                        <h2 className="section-title"><FaSearch /> Consultar Ticket por Número y Rifa</h2>
                        <button
                            onClick={() => {
                                setIsTicketQueryOpen(!isTicketQueryOpen);
                                // Limpiar campos y resultados al abrir/cerrar
                                setTicketNumber('');
                                setSelectedRifaIdForTicketQuery(''); 
                                setTicketQueryResult(null);
                                setTicketQueryError('');
                                setTicketQueryLoading(false);
                            }}
                            className="toggle-query-button"
                        >
                            {isTicketQueryOpen ? 'Ocultar Consulta' : 'Abrir Consulta'}
                        </button>
                    </div>

                    {isTicketQueryOpen && (
                        <div className="query-content">
                            <div className="query-inputs-grid"> {/* Nuevo grid para inputs de consulta */}
                                <div className="filter-group">
                                    <label htmlFor="ticketNumber" className="filter-label">Número de Ticket:</label>
                                    <input
                                        type="text"
                                        id="ticketNumber"
                                        value={ticketNumber}
                                        onChange={(e) => setTicketNumber(e.target.value)}
                                        placeholder="Ej: 0000, 42, 1234, 9999" // Placeholder actualizado
                                        maxLength="4" // MaxLength ajustado a 4
                                        className="filter-input"
                                    />
                                </div>

                                <div className="filter-group">
                                    <label htmlFor="selectRifaForTicket" className="filter-label">Seleccionar Rifa:</label>
                                    <select
                                        id="selectRifaForTicket"
                                        value={selectedRifaIdForTicketQuery}
                                        onChange={(e) => setSelectedRifaIdForTicketQuery(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="">Selecciona una Rifa</option>
                                        {rifas.map(rifa => (
                                            <option key={rifa._id} value={rifa._id}>{rifa.nombreProducto}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button 
                                onClick={handleTicketQuery} 
                                className="action-button primary-button query-button" 
                                disabled={ticketQueryLoading}
                            >
                                <FaSearch /> {ticketQueryLoading ? 'Buscando...' : 'Buscar Ticket'}
                            </button>

                            {ticketQueryError && <p className="error-message query-error-message">{ticketQueryError}</p>}

                            {/* --- Sección de Detalles del Ticket - Mejorada --- */}
                            {ticketQueryResult && (
                                <div className="ticket-details-result"> 
                                    <h4 className="ticket-result-title">Detalles para el Ticket: <span>{String(ticketQueryResult.numeroTicket || 'N/A').padStart(4, '0')}</span></h4>
                                    <div className="details-grid"> {/* Grid para los detalles */}
                                        <div className="detail-group">
                                            <h5>Información del Comprador:</h5>
                                            <p><strong>Nombre:</strong> {ticketQueryResult.nombreComprador || 'N/A'}</p>
                                            <p><strong>Identificación:</strong> {ticketQueryResult.tipoIdentificacionComprador || 'N/A'}-{ticketQueryResult.numeroIdentificacionComprador || 'N/A'}</p>
                                            <p><strong>Teléfono:</strong> {ticketQueryResult.telefonoComprador || 'N/A'}</p>
                                            <p><strong>Correo:</strong> {ticketQueryResult.emailComprador || 'N/A'}</p>
                                        </div>
                                        <div className="detail-group">
                                            <h5>Información del Ticket:</h5>
                                            <p><strong>Rifa:</strong> {ticketQueryResult.rifaId?.nombreProducto || 'N/A'}</p>
                                            <p><strong>Estado:</strong> <span className={`status-badge status-${ticketQueryResult.estado || 'desconocido'}`}>{ticketQueryResult.estado || 'N/A'}</span></p>
                                            {/* Si tienes comprobanteUrl en el ticket y quieres mostrarlo aquí */}
                                            {ticketQueryResult.comprobanteUrl && (
                                                <p><strong>Comprobante:</strong> <a href={ticketQueryResult.comprobanteUrl} target="_blank" rel="noopener noreferrer" className="view-comprobante-link">Ver</a></p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* --- Fin de Sección de Detalles del Ticket --- */}
                        </div>
                    )}
                </section>

                <hr className="divider" /> {/* Divisor entre secciones */}

                {/* Sección de Filtros y Búsqueda */}
                <section className="section-card-container filters-section">
                    <h2 className="section-title"><FaFilter /> Opciones de Filtro y Búsqueda</h2>
                    <div className="grid-filters">
                        <div className="filter-group">
                            <label htmlFor="rifaId" className="filter-label">Filtrar por Rifa:</label>
                            <select
                                id="rifaId"
                                name="rifaId"
                                value={filters.rifaId}
                                onChange={handleFilterChange}
                                className="filter-select"
                            >
                                <option value="">Todas las Rifas</option>
                                {rifas.map(rifa => (
                                    <option key={rifa._id} value={rifa._id}>{rifa.nombreProducto}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label htmlFor="estado" className="filter-label">Filtrar por Estado:</label>
                            <select
                                id="estado"
                                name="estado"
                                value={filters.estado}
                                onChange={handleFilterChange}
                                className="filter-select"
                            >
                                <option value="">Todos los Estados</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="verificado">Verificado</option>
                                <option value="rechazado">Rechazado</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label htmlFor="searchTerm" className="filter-label">Buscar <FaSearch /> (Ref., Nombre, Email):</label>
                            <input
                                type="text"
                                id="searchTerm"
                                name="searchTerm"
                                value={filters.searchTerm}
                                onChange={handleFilterChange}
                                placeholder="Buscar..."
                                className="filter-input"
                            />
                        </div>
                        <div className="filter-group">
                            <label htmlFor="limit" className="filter-label">Pagos por página:</label>
                            <select
                                id="limit"
                                name="limit"
                                value={filters.limit}
                                onChange={handleFilterChange}
                                className="filter-select"
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Sección de Tabla de Pagos */}
                <section className="section-card-container payments-table-section">
                    <h2 className="section-title">Lista de Pagos <FaDollarSign /></h2>
                    <div className="payments-table-wrapper"> {/* Contenedor para scroll horizontal en tablas */}
                        <table className="payments-table">
                            <thead>
                                <tr>
                                    <th>Referencia</th>
                                    <th>Rifa</th>
                                    <th>Comprador</th>
                                    <th>Tickets (#)</th>
                                    <th>Monto</th>
                                    <th>Método</th>
                                    <th>Comprobante</th>
                                    <th>Estado</th>
                                    <th>Fecha</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagos.length > 0 ? (
                                    pagos.map(pago => (
                                        <tr key={pago._id}>
                                            <td>{pago.referenciaPago || 'N/A'}</td> 
                                            <td>
                                                {pago.rifa?.nombreProducto || `ID: ${pago.rifa?._id || 'N/A'}`}
                                            </td>
                                            <td>
                                                <p><strong>Nombre:</strong> {pago.comprador?.nombre || 'N/A'}</p>
                                                <p>
                                                    <strong>ID:</strong> 
                                                    {pago.comprador?.tipoIdentificacion || 'N/A'}-
                                                    {pago.comprador?.numeroIdentificacion || 'N/A'}
                                                </p>
                                                <p><strong>Teléfono:</strong> {pago.comprador?.telefono || 'N/A'}</p>
                                                <p><strong>Correo:</strong> {pago.comprador?.email || 'N/A'}</p>
                                            </td>
                                            <td>
                                                {pago.cantidadTickets || 'N/A'}
                                                <br />
                                                <span className="tickets-assigned-list">
                                                    ({pago.numerosTicketsAsignados?.map(num => String(num).padStart(4, '0')).join(', ') || 'N/A'})
                                                </span>
                                            </td> 
                                            <td>
                                                ${typeof pago.montoTotalUSD === 'number' ? pago.montoTotalUSD.toFixed(2) : '0.00'}
                                                <br />
                                                Bs. {typeof pago.montoTotalVES === 'number' ? pago.montoTotalVES.toFixed(2) : '0.00'}
                                            </td>
                                            <td>{pago.metodo || 'N/A'}</td> 
                                            <td>
                                                {pago.comprobanteUrl ? (
                                                    <a href={`${axios.defaults.baseURL.replace('/api', '')}${pago.comprobanteUrl}`} target="_blank" rel="noopener noreferrer" className="view-comprobante-link">
                                                        Ver
                                                    </a>
                                                ) : 'N/A'}
                                            </td>
                                            <td>
                                                <span className={`status-badge status-${pago.estado || 'desconocido'}`}>
                                                    {pago.estado || 'Desconocido'}
                                                </span>
                                            </td>
                                            <td>{pago.fechaPago ? new Date(pago.fechaPago).toLocaleString('es-VE') : 'N/A'}</td>
                                            <td className="actions-cell">
                                                {pago.estado === 'pendiente' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleVerifyPago(pago._id)}
                                                            className="action-button success-button"
                                                            title="Verificar Pago"
                                                        >
                                                            <FaCheckCircle />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectPago(pago._id)}
                                                            className="action-button danger-button"
                                                            title="Rechazar Pago"
                                                        >
                                                            <FaTimesCircle />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleDeletePago(pago._id)}
                                                    className="action-button delete-button"
                                                    title="Eliminar Pago"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="10" className="no-payments-message">No hay pagos que coincidan con los criterios.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPagos > 0 && (
                        <nav className="pagination-controls" aria-label="Pagination">
                            <div className="pagination-info">
                                <p className="text-sm text-gray-700">
                                    Mostrando <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span> a <span className="font-medium">{Math.min(filters.page * filters.limit, totalPagos)}</span> de <span className="font-medium">{totalPagos}</span> resultados
                                </p>
                            </div>
                            <div className="pagination-buttons">
                                <button
                                    onClick={() => handlePageChange(filters.page - 1)}
                                    disabled={filters.page === 1}
                                    className="pagination-button"
                                >
                                    Anterior
                                </button>
                                <button
                                    onClick={() => handlePageChange(filters.page + 1)}
                                    disabled={filters.page === totalPages}
                                    className="pagination-button"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </nav>
                    )}
                </section>
            </div>
        </div>
    );
};

export default PagosPanel;