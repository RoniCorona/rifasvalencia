const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    rifaId: { // Revertido a rifaId
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rifa',
        required: true
    },
    nombreComprador: {
        type: String,
        required: false, 
        trim: true,
        default: null
    },
    emailComprador: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Por favor, introduce un correo electrónico válido'],
        default: null
    },
    telefonoComprador: {
        type: String,
        required: false,
        trim: true,
        default: null
    },
    tipoIdentificacionComprador: {
        type: String,
        enum: ['V', 'E', 'P', 'J', null],
        default: null
    },
    numeroIdentificacionComprador: {
        type: String,
        trim: true,
        default: null
    },
    numeroTicket: { // Revertido a numeroTicket
        type: String,
        required: true,
        trim: true
    },
    fechaCompra: {
        type: Date,
        default: null 
    },
    estado: {
        type: String,
        required: true,
        // ¡CORRECCIÓN CLAVE MANTENIDA! Añadimos 'disponible' al enum
        enum: ['disponible', 'pendiente_pago', 'pagado', 'anulado'], 
        default: 'disponible' 
    },
    metodoPagoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pago',
        default: null
    }
}, {
    timestamps: true
});

// Creamos un índice único compuesto con los nombres originales:
ticketSchema.index({ rifaId: 1, numeroTicket: 1 }, { unique: true });

const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;