// backend/models/TasaCambio.js
const mongoose = require('mongoose');

const tasaCambioSchema = new mongoose.Schema({
    valor: {
        type: Number,
        required: true,
        min: 0.01 // Asegura que la tasa sea un número positivo
    },
    fecha: {
        type: Date,
        default: Date.now // Guarda la fecha en que se registró esta tasa
    }
}, {
    timestamps: true // Añade createdAt y updatedAt
});

const TasaCambio = mongoose.model('TasaCambio', tasaCambioSchema);
module.exports = TasaCambio;