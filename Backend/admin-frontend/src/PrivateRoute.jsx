// admin-frontend/src/PrivateRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  // Obtenemos el token del localStorage
  const adminToken = localStorage.getItem('adminToken');

  // Si hay un token, el usuario está autenticado, así que renderizamos el contenido de la ruta anidada
  // Outlet es un componente de React Router que renderiza el componente hijo de la ruta protegida
  if (adminToken) {
    return <Outlet />;
  }

  // Si no hay token, el usuario no está autenticado, lo redirigimos a la página de login
  return <Navigate to="/login" replace />;
};

export default PrivateRoute;