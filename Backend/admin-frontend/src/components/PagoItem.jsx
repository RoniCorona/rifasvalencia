// admin-frontend/src/components/PagoItem.jsx
import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaTrash, FaDownload, FaInfoCircle } from 'react-icons/fa'; // Importa iconos adicionales

const PagoItem = ({ pago, onVerify, onReject, onDelete }) => {
    // Formatea la fecha y hora para una mejor legibilidad en la interfaz
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'; // Manejar caso de fecha nula
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        // 'undefined' usa la configuración regional del navegador del usuario
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Determina la clase CSS para el estilo del estado del pago
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'pendiente':
                return 'distintivo-estado pendiente';
            case 'verificado':
                return 'distintivo-estado verificado';
            case 'rechazado':
                return 'distintivo-estado rechazado';
            default:
                return 'distintivo-estado'; // Clase por defecto si el estado es desconocido
        }
    };

    // Construye la URL completa para el comprobante de pago
    const comprobanteFullUrl = pago.urlComprobante
        ? `http://localhost:5000${pago.urlComprobante}`
        : null;

    return (
        <tr className="fila-item-pago">
            {/* Referencia del Pago */}
            <td>
                <span className="texto-principal-tabla">{pago.referenciaPago}</span>
            </td>

            {/* Rifa asociada al Pago */}
            <td>
                <span className="texto-principal-tabla">{pago.rifa?.nombreProducto || 'Rifa Eliminada'}</span>
            </td>

            {/* Información del Comprador */}
            <td>
                <div className="detalles-comprador-contenedor">
                    <span className="texto-principal-tabla">{pago.nombreComprador || 'N/A'}</span>
                    {pago.emailComprador && (
                        <span className="texto-secundario-tabla bloque-texto">Email: {pago.emailComprador}</span>
                    )}
                    {pago.telefonoComprador && (
                        <span className="texto-secundario-tabla bloque-texto">Tel: {pago.telefonoComprador}</span>
                    )}
                    {pago.numeroIdentificacionComprador && (
                        <span className="texto-secundario-tabla bloque-texto">
                            ID: {pago.tipoIdentificacionComprador}-{pago.numeroIdentificacionComprador}
                        </span>
                    )}
                </div>
            </td>

            {/* Cantidad de Tickets y Números Asignados */}
            <td>
                <div className="tickets-info-contenedor">
                    <span className="texto-principal-tabla">{pago.cantidadTickets || 0} tickets</span>
                    {pago.numerosTicketsAsignados && pago.numerosTicketsAsignados.length > 0 && (
                        <span className="texto-secundario-tabla bloque-texto numeros-tickets">
                            #{pago.numerosTicketsAsignados.join(', #')}
                        </span>
                    )}
                </div>
            </td>

            {/* Monto y Moneda del Pago - ¡Aquí está la modificación! */}
            <td className="celda-monto"> {/* Clase para estilizar esta celda */}
                {pago.moneda === 'USD' ? (
                    <>
                        <span className="monto-usd">${(pago.montoTotal || 0).toFixed(2)} USD</span>
                        {pago.montoTotalVES && ( // Si también tenemos el monto en VES para un pago en USD
                            <span className="texto-secundario-tabla bloque-texto monto-secundario">
                                (VES {(pago.montoTotalVES || 0).toFixed(2)})
                            </span>
                        )}
                    </>
                ) : ( // Asumimos que si no es USD, entonces es VES
                    <>
                        <span className="monto-ves">VES {(pago.montoTotal || 0).toFixed(2)}</span>
                        {pago.montoTotalUSD && ( // Si tenemos el monto equivalente en USD para un pago en VES
                            <span className="texto-secundario-tabla bloque-texto monto-secundario">
                                (${(pago.montoTotalUSD || 0).toFixed(2)} USD)
                            </span>
                        )}
                    </>
                )}
                {pago.moneda === 'VES' && pago.tasaCambioUsada && (
                    <span className="texto-secundario-tabla bloque-texto tasa-cambio">
                        (Tasa: {pago.tasaCambioUsada} VES/$)
                    </span>
                )}
            </td>

            {/* Método de Pago y Comprobante */}
            <td>
                <span className="texto-principal-tabla">{pago.metodo || 'N/A'}</span>
                {comprobanteFullUrl ? (
                    <a
                        href={comprobanteFullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="enlace-comprobante"
                    >
                        <FaDownload /> Ver comprobante
                    </a>
                ) : (
                    <span className="texto-secundario-tabla bloque-texto">Sin comprobante</span>
                )}
            </td>

            {/* Estado del Pago */}
            <td>
                <span className={getStatusBadgeClass(pago.estado)}>
                    {pago.estado}
                </span>
                {pago.notasAdministrador && (
                    <p className="texto-secundario-tabla notas-admin">
                        <FaInfoCircle /> Notas: {pago.notasAdministrador}
                    </p>
                )}
            </td>

            {/* Fecha del Pago */}
            <td>
                <span className="texto-principal-tabla">
                    {formatDate(pago.fechaPago)}
                </span>
            </td>

            {/* Acciones para el Administrador */}
            <td className="celda-acciones">
                {pago.estado === 'pendiente' && (
                    <>
                        <button
                            onClick={() => onVerify(pago._id)}
                            className="boton-accion verificar"
                            title="Verificar Pago"
                        >
                            <FaCheckCircle />
                            <span className="texto-boton">Verificar</span>
                        </button>
                        <button
                            onClick={() => onReject(pago._id)}
                            className="boton-accion rechazar"
                            title="Rechazar Pago"
                        >
                            <FaTimesCircle />
                            <span className="texto-boton">Rechazar</span>
                        </button>
                    </>
                )}
                <button
                    onClick={() => onDelete(pago._id)}
                    className="boton-accion eliminar"
                    title="Eliminar Pago"
                >
                    <FaTrash />
                    <span className="texto-boton">Eliminar</span>
                </button>
            </td>
        </tr>
    );
};

export default PagoItem;