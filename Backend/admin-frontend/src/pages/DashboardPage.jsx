import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosInstance'; // O './api/axiosInstance' si estás en la misma carpeta

import {
    FaBoxes, FaCheckCircle, FaTimesCircle, FaDollarSign, FaMoneyBillWave,
    FaTicketAlt, FaHourglassHalf, FaChartLine, FaSpinner,
    FaClipboardList, FaFileInvoiceDollar, FaArrowLeft,
    FaUserShield
} from 'react-icons/fa';
import { GiProgression } from 'react-icons/gi';

// Importa los componentes de Chart.js
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';

// Registra los componentes necesarios para Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Tooltip,
    Legend
);

// Importa los estilos CSS específicos para esta página
import './DashboardPage.css';

function DashboardPage() {
    const navigate = useNavigate();
    const [adminName, setAdminName] = useState('');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('adminToken'));

    // Manejador de cierre de sesión
    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminInfo');
        setToken(null);
        navigate('/login');
    };

    // Manejador para volver atrás
    const handleGoBack = () => {
        navigate(-1);
    };

    // Efecto para cargar la información del administrador desde localStorage
    useEffect(() => {
        const storedAdminInfo = localStorage.getItem('adminInfo');
        if (storedAdminInfo) {
            try {
                const admin = JSON.parse(storedAdminInfo);
                setAdminName(admin.nombre || admin.email); // Usar 'nombre' si está disponible, sino 'email'
            } catch (e) {
                console.error("Error al parsear adminInfo desde localStorage", e);
                handleLogout(); // Si hay error al parsear, cierra sesión
            }
        } else {
            handleLogout(); // Si no hay información de admin, cierra sesión
        }
        setToken(localStorage.getItem('adminToken')); // Asegura que el token esté actualizado
    }, []);

    // Efecto para cargar las estadísticas del dashboard desde el backend
    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                setLoading(true); // Inicia el estado de carga
                setError(null); // Limpia cualquier error previo

                if (!token) {
                    setLoading(false);
                    setError('No hay token de autenticación disponible. Por favor, inicia sesión.');
                    handleLogout();
                    return;
                }

                // Configuración de la petición con el token de autorización
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                };

                // Realiza la petición GET a la API de estadísticas
                const response = await api.get('/dashboard/stats'); // El /api ya está incluido en axiosInstance
                setStats(response.data); // Guarda las estadísticas en el estado
                setLoading(false); // Finaliza el estado de carga
            } catch (err) {
                console.error('Error al cargar las estadísticas del dashboard:', err);
                // Manejo de errores de autenticación o de red
                if (err.response && err.response.status === 401) {
                    setError('Tu sesión ha expirado o no estás autorizado. Por favor, inicia sesión de nuevo.');
                    handleLogout();
                } else {
                    setError('Error al cargar las estadísticas. Intenta de nuevo más tarde.');
                }
                setLoading(false); // Finaliza el estado de carga incluso con error
            }
        };

        // Solo carga las estadísticas si hay un token disponible
        if (token) {
            fetchDashboardStats();
        } else {
            setLoading(false);
            setError('No hay token de autenticación. Por favor, inicia sesión.');
        }

    }, [token]); // Se ejecuta cada vez que el token cambia

    // Datos para el gráfico de barras de tickets por rifa
    const ticketsPerRifaData = {
        labels: stats?.chartData?.ticketsVendidosPorRifa?.map(r => r.nombreRifa) ?? [],
        datasets: [
            {
                label: 'Tickets Vendidos',
                data: stats?.chartData?.ticketsVendidosPorRifa?.map(r => r.totalTickets) ?? [],
                backgroundColor: 'rgba(59, 130, 246, 0.8)', // Azul de Tailwind con opacidad
                borderColor: 'rgba(37, 99, 235, 1)', // Azul más oscuro de Tailwind
                borderWidth: 1,
                borderRadius: 5, // Bordes redondeados para las barras
            },
        ],
    };

    // Datos para el gráfico de dona de estado de pagos
    const paymentStatusData = {
        labels: ['Pendientes', 'Verificados', 'Rechazados'],
        datasets: [
            {
                data: [
                    stats?.pagos?.pendientes ?? 0,
                    stats?.pagos?.verificados ?? 0,
                    stats?.pagos?.rechazados ?? 0
                ],
                backgroundColor: [
                    'rgba(255, 159, 64, 0.8)', // Naranja vibrante
                    'rgba(34, 197, 94, 0.8)',  // Verde vibrante
                    'rgba(239, 68, 68, 0.8)',  // Rojo vibrante
                ],
                borderColor: [
                    'rgba(255, 159, 64, 1)',
                    'rgba(34, 197, 94, 1)',
                    'rgba(239, 68, 68, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    // Opciones comunes para los gráficos
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: {
                        size: 14,
                        family: 'Inter, sans-serif', // Usar Inter para consistencia
                    },
                    color: '#333',
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                bodyColor: '#fff',
                titleColor: '#fff',
                padding: 10,
                cornerRadius: 5,
            },
        },
        maintainAspectRatio: false, // Permitir que el gráfico se ajuste al contenedor
        scales: {
            x: {
                ticks: {
                    color: '#555',
                    font: {
                        size: 12,
                        family: 'Inter, sans-serif',
                    }
                },
                grid: {
                    display: false // Oculta las líneas de la cuadrícula en el eje X
                }
            },
            y: {
                ticks: {
                    color: '#555',
                    font: {
                        size: 12,
                        family: 'Inter, sans-serif',
                    }
                },
                grid: {
                    color: 'rgba(200, 200, 200, 0.2)' // Líneas de cuadrícula sutiles en el eje Y
                }
            }
        }
    };

    // Componentes de carga, error y sin datos
    if (loading) {
        return (
            <div className="loading-screen">
                <FaSpinner className="loading-spinner" />
                <p className="loading-text">Cargando estadísticas del dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-screen">
                <FaTimesCircle className="error-icon" />
                <h1 className="error-title">¡Oops! Error al Cargar Datos</h1>
                <p className="error-message">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="action-button reload"
                >
                    <FaArrowLeft /> Recargar Página / Reintentar
                </button>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="error-screen">
                <FaChartLine className="error-icon no-data-icon" /> {/* Clase para ícono de "sin datos" */}
                <h1 className="error-title no-data-title">No se encontraron estadísticas para mostrar.</h1>
                <p className="error-message no-data-message-text">
                    Asegúrate de que tu backend está funcionando, tienes datos en la base de datos y que estás logueado correctamente.
                </p>
                <button
                    onClick={() => navigate('/login')}
                    className="action-button login"
                >
                    <FaArrowLeft className="rotate-180" /> Ir a Iniciar Sesión
                </button>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-content-wrapper"> {/* Nuevo contenedor para centrar y limitar ancho */}

                {/* --- HEADER DEL DASHBOARD --- */}
                <header className="dashboard-header">
                    <h1 className="dashboard-title">
                        Panel de <span>Control</span> 📊
                    </h1>
                    {adminName && (
                        <p className="welcome-message">
                            ¡Bienvenido de nuevo, <span>{adminName}</span>! Aquí tienes un resumen dinámico del estado de tus rifas y actividades.
                        </p>
                    )}
                    <div className="header-buttons">
                        <Link to="/rifas" className="header-btn rifas">
                            <FaClipboardList /> Gestionar Rifas
                        </Link>
                        <Link to="/pagos" className="header-btn pagos">
                            <FaFileInvoiceDollar /> Gestionar Pagos
                        </Link>
                        {/* Botón/Enlace para gestionar administradores */}
                        <Link to="/admin-users" className="header-btn admin-users">
                            <FaUserShield /> Administradores
                        </Link>
                        <button onClick={handleLogout} className="header-btn logout">
                            <FaTimesCircle /> Cerrar Sesión
                        </button>
                    </div>
                </header>

                {/* --- SECCIÓN 1: ESTADÍSTICAS GENERALES DE RIFAS --- */}
                <section className="section-card-container rifas-summary"> {/* Clase específica para esta sección */}
                    <h2 className="section-title">Resumen de Rifas</h2>
                    <div className="stats-grid"> {/* Grid responsivo para las tarjetas */}
                        <DashboardCard title="Rifas Totales" value={stats.rifas.total} color="blue" icon={FaBoxes} link="/rifas" />
                        <DashboardCard title="Rifas Activas" value={stats.rifas.activas} color="green" icon={FaCheckCircle} link="/rifas?status=active" />
                        <DashboardCard title="Rifas en Progreso" value={stats.rifas.enProgreso} color="purple" icon={GiProgression} link="/rifas?status=inProgress" />
                        <DashboardCard title="Rifas Finalizadas" value={stats.rifas.finalizadas} color="red" icon={FaTimesCircle} link="/rifas?status=finished" />
                    </div>
                </section>

                {/* --- SECCIÓN 2: ESTADÍSTICAS DE TICKETS Y RECAUDACIÓN --- */}
                <section className="section-card-container tickets-revenue-summary"> {/* Clase específica */}
                    <div className="subsection-grid"> {/* Grid para subsecciones */}
                        {/* Recuadro de Tickets */}
                        <div className="sub-section-card tickets-stats"> {/* Clase específica para esta tarjeta */}
                            <h2 className="section-title">Tickets</h2>
                            <div className="stats-grid-2cols"> {/* Grid de 2 columnas */}
                                <DashboardCard title="Tickets Vendidos (Verificados)" value={stats.tickets.vendidos} color="indigo" icon={FaTicketAlt} />
                                <DashboardCard title="Tickets Disponibles" value={stats.tickets.disponibles} color="yellow" icon={FaTicketAlt} />
                            </div>
                        </div>

                        {/* Recuadro de Monto Recaudado */}
                        <div className="sub-section-card revenue-stats"> {/* Clase específica para esta tarjeta */}
                            <h2 className="section-title">Recaudación Total</h2>
                            <div className="stats-grid-2cols"> {/* Grid de 2 columnas */}
                                <DashboardCard title="Recaudado USD (Verificado)" value={`$${stats.pagos.montoTotalUSD ? stats.pagos.montoTotalUSD.toFixed(2) : '0.00'}`} color="gray" icon={FaDollarSign} />
                                <DashboardCard title="Recaudado VES (Verificado)" value={`Bs. ${stats.pagos.montoTotalVES ? stats.pagos.montoTotalVES.toFixed(2) : '0.00'}`} color="dark-green" icon={FaMoneyBillWave} /> {/* Color ajustado */}
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- SECCIÓN 3: ESTADÍSTICAS DE PAGOS --- */}
                <section className="section-card-container payments-summary"> {/* Clase específica */}
                    <h2 className="section-title">Resumen de Pagos</h2>
                    <div className="stats-grid-3cols"> {/* Grid de 3 columnas */}
                        <DashboardCard title="Pagos Pendientes" value={stats.pagos.pendientes} color="orange" icon={FaHourglassHalf} link="/pagos?status=pendiente" />
                        <DashboardCard title="Pagos Verificados" value={stats.pagos.verificados} color="teal" icon={FaCheckCircle} link="/pagos?status=verificado" />
                        <DashboardCard title="Pagos Rechazados" value={stats.pagos.rechazados} color="pink" icon={FaTimesCircle} link="/pagos?status=rechazado" />
                    </div>
                </section>

                {/* --- SECCIÓN 4: GRÁFICOS --- */}
                <section className="section-card-container charts-section"> {/* Clase específica */}
                    <h2 className="section-title">Análisis Visual</h2>
                    <div className="charts-grid"> {/* Grid para los gráficos */}
                        {/* Contenedor individual para el Gráfico de Ventas de Tickets por Rifa */}
                        <div className="chart-container-card">
                            <h3 className="chart-title">Top Rifas por Tickets Vendidos</h3>
                            {stats && stats.chartData && stats.chartData.ticketsVendidosPorRifa && ticketsPerRifaData.labels.length > 0 ? (
                                <div className="chart-wrapper"> {/* Wrapper para el gráfico */}
                                    <Bar data={ticketsPerRifaData} options={chartOptions} />
                                </div>
                            ) : (
                                <p className="no-chart-data-message">No hay datos de ventas de tickets por rifa para mostrar.</p>
                            )}
                        </div>

                        {/* Contenedor individual para el Gráfico de Estado de Pagos */}
                        <div className="chart-container-card">
                            <h3 className="chart-title">Estado de Pagos</h3>
                            {stats && stats.pagos ? (
                                <div className="chart-wrapper"> {/* Wrapper para el gráfico */}
                                    <Doughnut data={paymentStatusData} options={chartOptions} />
                                </div>
                            ) : (
                                <p className="no-chart-data-message">No hay datos de estado de pagos para mostrar.</p>
                            )}
                        </div>
                    </div>
                </section>

                {/* --- Botón Volver Atrás (Sección propia para mantener el diseño flotante) --- */}
                <div className="back-button-container-fixed"> {/* Clase para botón fijo */}
                    <button
                        onClick={handleGoBack}
                        className="back-button-fixed"
                    >
                        <FaArrowLeft /> Volver Atrás
                    </button>
                </div>

            </div>
        </div>
    );
}

// Componente auxiliar para las tarjetas de estadísticas
const DashboardCard = ({ title, value, color, icon: Icon, link }) => {
    // Mapeo de colores a clases CSS
    const colorClasses = {
        blue: 'card-blue',
        green: 'card-green',
        purple: 'card-purple',
        red: 'card-red',
        indigo: 'card-indigo',
        yellow: 'card-yellow',
        orange: 'card-orange',
        teal: 'card-teal',
        gray: 'card-gray',
        pink: 'card-pink',
        'dark-green': 'card-dark-green', // Nuevo color para VES
    };

    const content = (
        <div className={`dashboard-card ${colorClasses[color] || 'card-default'}`}>
            <div className="dashboard-card-content">
                <h3 className="dashboard-card-title">{title}</h3>
                <p className="dashboard-card-value">{value}</p>
            </div>
            {Icon && <Icon className="dashboard-card-icon-bg" />}
        </div>
    );

    return link ? (
        <Link to={link} className="block no-underline">
            {content}
        </Link>
    ) : (
        content
    );
};

export default DashboardPage;
