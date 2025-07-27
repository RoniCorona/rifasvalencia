import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance'; // ✅ Usamos la instancia de Axios correctamente configurada

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); // Previene el comportamiento por defecto del formulario
    setError('');
    setLoading(true);

    try {
      // ✅ Usamos api (axiosInstance) en vez de axios directo
      const response = await api.post('/admin/login', {
  email,
  password,
});

      const { token, admin } = response.data;

      // ✅ Guardamos el token e información del admin
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminInfo', JSON.stringify(admin));

      navigate('/');
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Ocurrió un error inesperado al intentar iniciar sesión. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar Sesión Administrador</h2>
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Introduce tu email"
            autoComplete="username"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Introduce tu contraseña"
            autoComplete="current-password"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Iniciando...' : 'Entrar al Panel'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
