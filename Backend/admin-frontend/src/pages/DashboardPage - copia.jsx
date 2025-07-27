import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Importa Link para la navegación

function DashboardPage() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    // Al cargar el componente, intentamos obtener la información del administrador
    const storedAdminInfo = localStorage.getItem('adminInfo');
    if (storedAdminInfo) {
      try {
        const admin = JSON.parse(storedAdminInfo);
        setAdminName(admin.nombre || admin.email); // Usamos el nombre o el email
      } catch (e) {
        console.error("Error al parsear adminInfo desde localStorage", e);
        // Si hay un error, el token podría ser inválido, podríamos querer limpiar y redirigir
        handleLogout();
      }
    } else {
      // Si no hay adminInfo, redirigimos por seguridad (aunque PrivateRoute ya lo haría)
      handleLogout();
    }
  }, []); // El array vacío asegura que esto se ejecute solo una vez al montar

  const handleLogout = () => {
    // Elimina el token y la información del admin del localStorage
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    // Redirige al usuario a la página de login
    navigate('/login');
  };

  return (
    <div>
      <h2>Dashboard del Administrador</h2>
      {adminName ? (
        <p>¡Bienvenido, **{adminName}**! Aquí verás un resumen de tu sistema de rifas.</p>
      ) : (
        <p>¡Bienvenido! Aquí verás un resumen de tu sistema de rifas.</p>
      )}

      {/* Botón de Cerrar Sesión */}
      <button onClick={handleLogout} className="logout-button">
        Cerrar Sesión
      </button>

      {/* Contenido del Dashboard */}
      <div className="dashboard-content">
        <p>Estadísticas rápidas:</p>
        <ul>
          <li>Total de Rifas Activas: [Contador]</li>
          <li>Tickets Vendidos Hoy: [Contador]</li>
          <li>Pagos Pendientes de Verificación: [Contador]</li>
        </ul>
        {/* Enlace a la gestión de rifas */}
        <p>
            <Link to="/rifas" className="nav-link-button">Ir a Gestión de Rifas</Link>
        </p>
        {/* Aquí podrías añadir más enlaces a otras secciones del panel */}
        {/* <p>
            <Link to="/pagos" className="nav-link-button">Ir a Gestión de Pagos</Link>
        </p> */}
      </div>
    </div>
  );
}

export default DashboardPage;