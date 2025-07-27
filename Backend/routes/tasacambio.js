// backend/routes/tasacambio.js
const express = require('express');
const router = express.Router();
const TasaCambio = require('../models/TasaCambio'); // Asegúrate que esta ruta a tu modelo sea correcta
const { protect, authorize } = require('../middleware/auth'); // Importa tus middlewares de autenticación

// 1. GET /api/tasacambio/latest
// Propósito: Obtener la última tasa de cambio registrada (PÚBLICA)
router.get('/latest', async (req, res) => {
    try {
        // Busca la tasa de cambio más reciente, ordenada por fechaActualizacion descendente
        const latestTasa = await TasaCambio.findOne().sort({ fechaActualizacion: -1 });

        if (!latestTasa) {
            console.log('Backend: No hay tasas de cambio registradas en la base de datos.');
            return res.status(404).json({ message: 'No hay tasas de cambio registradas.' });
        }
        console.log('Backend: Tasa de cambio más reciente encontrada:', latestTasa);
        res.json(latestTasa);
    } catch (err) {
        console.error('Backend: Error al obtener la última tasa de cambio:', err);
        res.status(500).json({ message: 'Error interno del servidor al obtener la tasa de cambio.' });
    }
});

// 2. POST /api/tasacambio
// Propósito: Crear o actualizar una nueva tasa de cambio (PROTEGIDA - Solo Administradores)
router.post('/', protect, authorize(['admin']), async (req, res) => { // <--- AUTENTICACIÓN ACTIVADA DE NUEVO
    const { valor } = req.body;

    if (valor === undefined || typeof valor !== 'number' || valor <= 0) {
        return res.status(400).json({ message: 'El valor de la tasa de cambio es obligatorio y debe ser un número positivo.' });
    }

    try {
        const newTasa = new TasaCambio({
            valor: valor,
            fechaActualizacion: new Date() // Se actualiza la fecha cada vez que se crea una nueva
        });
        await newTasa.save();
        console.log('Backend: Nueva tasa de cambio guardada:', newTasa);
        res.status(201).json(newTasa);
    } catch (err) {
        console.error('Backend: Error al crear/actualizar la tasa de cambio:', err);
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
