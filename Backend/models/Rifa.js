// backend/models/Rifa.js
const mongoose = require('mongoose');

const rifaSchema = new mongoose.Schema({
    nombreProducto: {
        type: String,
        required: true,
        trim: true,
    },
    descripcion: {
        type: String,
        required: true,
    },
    imagenUrl: {
        type: String,
        required: true,
    },
    precioTicketUSD: {
        type: Number,
        required: true,
        min: 0.01,
    },
    tasaCambio: { // Tasa de cambio VES por USD
        type: Number,
        required: true,
        min: 0.01,
    },
    precioTicketVES: {
        type: Number,
    },
    totalTickets: {
        type: Number,
        required: true,
        min: 1,
    },
    ticketsVendidos: { 
        type: Number,
        default: 0,
        min: 0,
    },
    ticketsDisponibles: {
        type: Number,
        min: 0,
    },
    numerosTickets: [{ 
        numeroTicket: { 
            type: String, 
            required: true,
        },
        comprador: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', 
        },
        nombreComprador: { 
            type: String,
        },
        fechaCompra: {
            type: Date,
            default: Date.now,
        },
        estadoPago: {
            type: String,
            enum: ['pendiente', 'pagado', 'cancelado'],
            default: 'pendiente',
        },
    }],
    estado: { // Este es el estado general de la rifa (activa, pausada, finalizada, sorteada)
        type: String,
        enum: ['activa', 'pausada', 'finalizada', 'sorteada'],
        default: 'activa',
    },
    // ¡NUEVO CAMPO! Para el control manual de si la rifa está abierta para la venta
    estaAbiertaParaVenta: {
        type: Boolean,
        default: true, // Por defecto, una rifa nueva está abierta para la venta
        required: true,
    },
    sorteada: { 
        type: Boolean,
        default: false,
    },
    ganadores: [{ 
        posicion: String, 
        numeroGanador: String,
        idComprador: mongoose.Schema.Types.ObjectId, 
        nombreGanador: String,
        emailGanador: String,
        telefonoGanador: String,
        fechaSorteo: Date, 
    }],
    fechaInicioSorteo: { 
        type: Date,
        required: true,
    },
    fechaFin: { 
        type: Date,
        required: true,
    },
    fechaSorteo: { 
        type: Date,
        required: false, 
    },
}, {
    timestamps: true, 
});

// Virtual para el porcentaje vendido (sin cambios)
rifaSchema.virtual('porcentajeVendido').get(function() {
    if (this.totalTickets === 0) return 0;
    return (this.ticketsVendidos / this.totalTickets) * 100;
});

// Virtual para determinar el estado de "compra" de la rifa (si está abierta o cerrada)
// Considera tanto si está manualmente cerrada como si se agotaron los tickets
rifaSchema.virtual('estadoCompra').get(function() {
    if (this.ticketsVendidos >= this.totalTickets) {
        return 'agotada'; // Agotada por venta
    }
    if (this.estado !== 'activa') {
        return 'inactiva'; // No activa (pausada, finalizada, sorteada)
    }
    if (this.estaAbiertaParaVenta === false) { // Si está manualmente cerrada
        return 'cerrada_manual';
    }
    return 'abierta'; // Abierta para la venta
});


rifaSchema.set('toJSON', { virtuals: true });
rifaSchema.set('toObject', { virtuals: true });

rifaSchema.pre('save', function(next) {
    if (this.isModified('precioTicketUSD') || this.isModified('tasaCambio')) {
        this.precioTicketVES = this.precioTicketUSD * this.tasaCambio;
    }
    if (this.isModified('totalTickets') || this.isModified('ticketsVendidos')) {
        this.ticketsDisponibles = this.totalTickets - this.ticketsVendidos;
    }
    next();
});

rifaSchema.post(['find', 'findOne'], function(docs, next) {
    const processDoc = (doc) => {
        if (doc) {
            if (typeof doc.precioTicketUSD === 'number' && typeof doc.tasaCambio === 'number') {
                doc.precioTicketVES = doc.precioTicketUSD * doc.tasaCambio;
            } else {
                doc.precioTicketVES = 0; 
            }

            if (typeof doc.totalTickets === 'number' && typeof doc.ticketsVendidos === 'number') {
                doc.ticketsDisponibles = doc.totalTickets - doc.ticketsVendidos;
            } else {
                doc.ticketsDisponibles = 0; 
            }
        }
    };

    if (Array.isArray(docs)) {
        docs.forEach(processDoc);
    } else {
        processDoc(docs);
    }
    next();
});


const Rifa = mongoose.model('Rifa', rifaSchema);

module.exports = Rifa;