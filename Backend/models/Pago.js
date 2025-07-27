// backend/models/Pago.js (¡IMPORTANTE: ESTE ES EL CÓDIGO CORRECTO!)

const mongoose = require('mongoose');

const PagoSchema = new mongoose.Schema({
    // Referencia a la rifa a la que pertenece este pago
    rifa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rifa',
        required: true
    },
    // Información del comprador como SUBDOCUMENTO
    comprador: { // <--- ¡AQUÍ ESTÁ LA CORRECCIÓN CLAVE!
        nombre: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            match: [/.+@.+\..+/, 'Por favor, introduce un correo electrónico válido']
        },
        telefono: {
            type: String,
            required: true,
            trim: true
        },
        tipoIdentificacion: {
            type: String,
            enum: ['V', 'E', 'P', 'J', 'G', null],
            default: null
        },
        numeroIdentificacion: {
            type: String,
            trim: true,
            default: null
        }
    },
    cantidadTickets: {
        type: Number,
        required: true,
        min: 1
    },
    montoTotal: { // Monto original pagado por el cliente (en la moneda especificada en 'moneda')
        type: Number,
        required: true,
        min: 0.01
    },
    moneda: { // Moneda en la que se realizó el pago original ('USD' o 'VES')
        type: String,
        required: true,
        enum: ['USD', 'VES']
    },
    montoTotalUSD: { // Monto total equivalente en USD, calculado al momento del pago
        type: Number,
        required: true,
        min: 0
    },
    montoTotalVES: { // Monto total equivalente en VES, calculado al momento del pago
        type: Number,
        required: true,
        min: 0
    },
    tasaCambioUsada: { // Tasa de cambio (VES/USD) aplicada al momento del pago
        type: Number,
        required: false, 
        min: 0.01 
    },
    metodo: {
        type: String,
        required: true,
        enum: ['Binance', 'Pago Móvil', 'Transferencia Bancaria', 'Zelle', 'Efectivo', 'Otro']
    },
    referenciaPago: {
        type: String,
        required: true,
        trim: true,
        // unique: true // Si esta línea te da problemas al intentar duplicar pagos por pruebas, puedes comentarla TEMPORALMENTE.
    },
    comprobanteUrl: {
        type: String,
        required: false, 
        default: null
    },
    numerosTicketsAsignados: [{ // Array de strings para los números de ticket (ej: "0001", "0005")
        type: String, // <--- Tipo String como lo enviamos en el controlador
        required: true
    }],
    estado: {
        type: String,
        required: true,
        enum: ['pendiente', 'verificado', 'rechazado'],
        default: 'pendiente'
    },
    fechaPago: {
        type: Date,
        default: Date.now
    },
    notasAdministrador: {
        type: String,
        required: false
    }
}, {
    timestamps: true // Esto añade createdAt y updatedAt automáticamente
});

// Middleware para asegurar que si el estado cambia a 'verificado' o 'rechazado',
// no se pueda volver a cambiar a 'pendiente'.
PagoSchema.pre('save', async function(next) {
    // Si el estado no ha sido modificado, o si es un nuevo documento
    if (!this.isModified('estado') || this.isNew) {
        return next();
    }

    // Si el estado está intentando cambiar a 'pendiente'
    if (this.get('estado') === 'pendiente') {
        // Busca el documento existente en la base de datos para verificar su estado actual
        const existingPago = await this.constructor.findById(this._id);
        if (existingPago && ['verificado', 'rechazado'].includes(existingPago.estado)) {
            return next(new Error('No se puede cambiar el estado de un pago ya verificado o rechazado a pendiente.'));
        }
    }
    next();
});

const Pago = mongoose.model('Pago', PagoSchema);
module.exports = Pago;
