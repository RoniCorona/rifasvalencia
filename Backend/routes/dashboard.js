const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth'); // Asegúrate de que esta ruta sea correcta

// Ruta protegida para obtener las estadísticas del dashboard
router.get('/stats', protect, getDashboardStats);

module.exports = router;