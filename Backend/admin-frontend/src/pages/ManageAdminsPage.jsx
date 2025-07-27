// src/pages/ManageAdminsPage.jsx (Crea este nuevo archivo)

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosInstance'; // Asegúrate de que la ruta sea correcta
import { FaUserPlus, FaArrowLeft, FaEdit, FaTrashAlt, FaSearch, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import './ManageAdminsPage.css'; // Crea este CSS para tus estilos

function ManageAdminsPage() {
    const navigate = useNavigate();
    const [token, setToken] = useState(localStorage.getItem('adminToken'));
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        // rol: 'admin' // Si tienes roles diferentes, podrías añadir un selector aquí
    });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'

    // Función para mostrar mensajes al usuario
    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 5000);
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminInfo');
        setToken(null);
        navigate('/login');
    };

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            setError(null);
            if (!token) {
                handleLogout();
                return;
            }
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            // Asumimos que tendrás una ruta en tu backend para listar admins
            const response = await api.get('/admin/users', config); // Utiliza la instancia configurada 'api'
            setAdmins(response.data.admins); // Asegúrate que tu API devuelve un objeto con 'admins'
            setLoading(false);
        } catch (err) {
            console.error('Error al cargar administradores:', err);
            if (err.response && err.response.status === 401) {
                setError('Tu sesión ha expirado o no estás autorizado. Por favor, inicia sesión de nuevo.');
                handleLogout();
            } else {
                setError('Error al cargar la lista de administradores.');
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, [token]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setMessage('');
            setMessageType('');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            // Asumimos que tendrás una ruta en tu backend para crear admins
        const response = await api.post('/admin/register-new', formData, config); // Usa 'api.post' en lugar de 'axios.post'
            showMessage(response.data.message || 'Administrador creado exitosamente.', 'success');
            setFormData({ nombre: '', email: '', password: '' }); // Limpiar formulario
            fetchAdmins(); // Recargar la lista de administradores
        } catch (err) {
            console.error('Error al crear administrador:', err);
            const errMsg = err.response?.data?.message || 'Error al crear administrador. Inténtalo de nuevo.';
            showMessage(errMsg, 'error');
            if (err.response && err.response.status === 401) {
                handleLogout();
            }
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <FaSpinner className="loading-spinner" />
                <p className="loading-text">Cargando administradores...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-screen">
                <FaTimesCircle className="error-icon" />
                <h1 className="error-title">¡Oops! Error al Cargar Administradores</h1>
                <p className="error-message">{error}</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="action-button reload"
                >
                    <FaArrowLeft /> Volver al Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="manage-admins-container">
            <header className="manage-admins-header">
                <h1 className="manage-admins-title">Gestionar <span>Administradores</span> <FaUserPlus /></h1>
                <Link to="/dashboard" className="back-button">
                    <FaArrowLeft /> Volver al Dashboard
                </Link>
            </header>

            {message && (
                <div className={`message-alert ${messageType}`}>
                    {message}
                </div>
            )}

            <section className="admin-form-section section-card-container">
                <h2 className="section-title">Crear Nuevo Administrador</h2>
                <form onSubmit={handleSubmit} className="admin-form">
                    <div className="form-group">
                        <label htmlFor="nombre">Nombre:</label>
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Contraseña:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" className="submit-btn">
                        <FaUserPlus /> Crear Administrador
                    </button>
                </form>
            </section>

            <section className="admin-list-section section-card-container">
                <h2 className="section-title">Lista de Administradores</h2>
                {admins.length > 0 ? (
                    <table className="admins-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Rol</th> {/* Si tu Admin model tiene rol */}
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map(admin => (
                                <tr key={admin._id}>
                                    <td>{admin.nombre}</td>
                                    <td>{admin.email}</td>
                                    <td>{admin.role || 'admin'}</td> {/* Asume 'admin' si no hay rol explícito */}
                                    <td>
                                        {/* Implementar funcionalidad de editar/eliminar si es necesario */}
                                        <button className="icon-btn edit-btn" title="Editar Admin">
                                            <FaEdit />
                                        </button>
                                        <button className="icon-btn delete-btn" title="Eliminar Admin">
                                            <FaTrashAlt />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="no-data-message">No hay otros administradores registrados.</p>
                )}
            </section>
        </div>
    );
}

export default ManageAdminsPage;