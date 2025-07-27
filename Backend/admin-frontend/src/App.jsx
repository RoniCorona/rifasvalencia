import React from 'react';
// ¡IMPORTANTE! Eliminamos BrowserRouter de aquí. Solo necesitamos Routes, Route y Navigate.
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Componentes de Páginas
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RifasPage from './pages/RifasPage';
import PagosPanel from './pages/PagosPanel';
import ManageAdminsPage from './pages/ManageAdminsPage'; // <--- ¡NUEVA IMPORTACIÓN!
import PrivateRoute from './PrivateRoute'; // Asegúrate que esta ruta a PrivateRoute sea correcta

function App() {
  return (
    // ¡ELIMINAMOS EL <Router> DE AQUÍ! Tu main.jsx ya lo provee.
    <div className="App">
      <header className="App-header">
        <h1>Panel Administrativo de Rifas</h1>
      </header>

      <main className="App-main">
        <Routes>
          {/* Ruta de Login (NO protegida) */}
          <Route path="/login" element={<LoginPage />} />

          {/* Grupo de Rutas Protegidas */}
          <Route element={<PrivateRoute />}>
            {/* Ruta para la raíz: redirige a /dashboard por defecto si estás logueado */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Ruta explícita para el Dashboard */}
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Otras Rutas Protegidas */}
            <Route path="/rifas" element={<RifasPage />} />
            <Route path="/pagos" element={<PagosPanel />} />
            
            {/* ¡NUEVA RUTA PROTEGIDA para la gestión de administradores! */}
            <Route path="/admin-users" element={<ManageAdminsPage />} /> {/* <--- ¡NUEVA RUTA! */}

          </Route>

          {/* Opcional: Ruta para manejar 404 - Páginas no encontradas */}
          {/* <Route path="*" element={<div>404 Not Found</div>} /> */}
        </Routes>
      </main>
    </div>
  );
}

export default App;
