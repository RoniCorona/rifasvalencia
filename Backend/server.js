// Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();

// ===========================
// 🔐 Middleware básico
// ===========================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===========================
// 🌍 CORS
// ===========================
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173','http://127.0.0.1:5500','http://localhost:5000','https://www.modorifa.com'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS bloqueado para origen: ${origin}`), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ===========================
// 📦 Archivos estáticos
// ===========================

// Comprobantes de pago (desde backend/uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Frontend público desde raíz del proyecto
const publicRootPath = path.join(__dirname, '..');
app.use(express.static(publicRootPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicRootPath, 'index.html'));
});

app.get('/rifa.html', (req, res) => {
  res.sendFile(path.join(publicRootPath, 'rifa.html'));
});

// Panel admin (React build dentro de /backend/admin)
const adminPath = path.join(__dirname, 'admin');
app.use('/admin', express.static(adminPath));

// ✅ CORREGIDO: usar RegExp para rutas de React admin
app.get(/^\/admin(\/.*)?$/, (req, res) => {
  res.sendFile(path.join(adminPath, 'index.html'));
});

// ===========================
// 🔗 Conexión a MongoDB
// ===========================
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// ===========================
// 📚 Modelos
// ===========================
require('./models/Rifa');
require('./models/Ticket');
require('./models/Pago');
require('./models/Admin');
require('./models/TasaCambio');

// ===========================
// 🧭 Rutas API
// ===========================
app.use('/api/admin', require('./routes/adminAuth'));
app.use('/api/rifas', require('./routes/rifas'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/pagos', require('./routes/pagos'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/tasacambio', require('./routes/tasacambio'));

// ===========================
// 🚀 Iniciar servidor
// ===========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
  console.log(`🟢 Frontend público: /`);
  console.log(`🟢 Panel admin: /admin`);
  console.log(`🟢 API: /api/...`);
});
