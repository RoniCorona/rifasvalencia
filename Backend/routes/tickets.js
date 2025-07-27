// backend/routes/tickets.js
const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Rifa = require('../models/Rifa'); // Asegúrate de que este modelo esté disponible

const { protect, authorize } = require('../middleware/auth'); 

const formatTicketNumber = (num) => {
    // Asegura que el número se formatee con ceros a la izquierda para 4 dígitos (ej: 0 -> "0000", 1 -> "0001")
    return String(num).padStart(4, '0');
};

// Función para barajar un array (algoritmo de Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Intercambiar elementos
    }
    return array;
}

// --- Rutas (Endpoints) para la gestión de Tickets ---

// 1. POST /api/tickets/comprar (PÚBLICA) - Esta ruta NO debería usarse para la compra final
// ya que la lógica de asignación y registro de tickets se movió a /api/pagos
// Sin embargo, si se utiliza para la generación inicial de tickets, ahora generará del 0000 al 9999.
router.post('/comprar', async (req, res) => {
    // ESTA RUTA NO DEBERÍA SER UTILIZADA PARA LA COMPRA FINAL DE TICKETS.
    // LA LÓGICA DE COMPRA Y ASIGNACIÓN DE TICKETS SE MANEJA EN EL ENDPOINT POST /api/pagos.
    // Se ha modificado para generar números del 0000 al 9999 si se utiliza para otros fines.

    const { rifaId, cantidadTickets, nombreComprador, emailComprador, telefonoComprador, tipoIdentificacionComprador, numeroIdentificacionComprador } = req.body;

    if (!rifaId || !cantidadTickets || cantidadTickets <= 0 || !nombreComprador || !emailComprador || !telefonoComprador) {
        return res.status(400).json({ message: 'Faltan campos requeridos para la compra de tickets.' });
    }

    try {
        const rifa = await Rifa.findById(rifaId);
        if (!rifa) {
            return res.status(404).json({ message: 'Rifa no encontrada.' });
        }
        if (rifa.estado !== 'activa') {
            return res.status(400).json({ message: 'La rifa no está activa para la compra de tickets.' });
        }

        const ticketsDisponibles = rifa.totalTickets - rifa.ticketsVendidos;
        if (cantidadTickets > ticketsDisponibles) {
            return res.status(400).json({ message: `Solo quedan ${ticketsDisponibles} tickets disponibles para esta rifa.` });
        }

        const ticketsAComprar = [];
        let ticketsAsignadosCount = 0;

        const ticketsExistentes = await Ticket.find({ rifaId }).select('numeroTicket');
        const numerosAsignadosParaEstaRifa = new Set(ticketsExistentes.map(t => t.numeroTicket)); // Los números en DB son strings

        // ¡MODIFICACIÓN CLAVE! El bucle ahora va de 0 a (totalTickets - 1)
        for (let i = 0; i < rifa.totalTickets && ticketsAsignadosCount < cantidadTickets; i++) { 
            const numeroGenerado = formatTicketNumber(i); // Formatea el número (ej: 0 -> "0000")
            if (!numerosAsignadosParaEstaRifa.has(numeroGenerado)) {
                ticketsAComprar.push({
                    rifaId,
                    numeroTicket: numeroGenerado, // Guarda el número formateado como string
                    nombreComprador,
                    emailComprador,
                    telefonoComprador,
                    tipoIdentificacionComprador: tipoIdentificacionComprador || null,
                    numeroIdentificacionComprador: numeroIdentificacionComprador || null,
                    estado: 'pendiente_pago' 
                });
                numerosAsignadosParaEstaRifa.add(numeroGenerado);
                ticketsAsignadosCount++;
            }
        }

        if (ticketsAsignadosCount < cantidadTickets) {
            return res.status(400).json({ message: `No hay suficientes números de tickets disponibles para esta rifa. Solo se pudieron asignar ${ticketsAsignadosCount}.` });
        }

        const ticketsGuardados = await Ticket.insertMany(ticketsAComprar);

        rifa.ticketsVendidos += ticketsGuardados.length;
        await rifa.save();

        res.status(201).json({
            message: `Tickets generados y asignados exitosamente para la rifa ${rifa.nombreProducto}.`,
            tickets: ticketsGuardados,
            rifaActualizada: {
                ticketsVendidos: rifa.ticketsVendidos,
                porcentajeVendido: rifa.porcentajeVendidos 
            }
        });

    } catch (err) {
        console.error('Error al comprar tickets (ruta /api/tickets/comprar):', err);
        res.status(500).json({ message: 'Error interno del servidor al procesar la compra de tickets.', error: err.message });
    }
});

// NUEVA RUTA: GET /api/tickets/consultar (PÚBLICA - Acepta email y rifaId opcional)
router.get('/consultar', async (req, res) => {
    const { email, rifaId } = req.query; 

    if (!email) {
        return res.status(400).json({ message: 'Se requiere un correo electrónico para consultar tickets.' });
    }

    try {
        let query = { 
            emailComprador: email,
            estado: { $in: ['pendiente_pago', 'pagado'] } 
        };

        if (rifaId) { 
            query.rifaId = rifaId;
        }

        const tickets = await Ticket.find(query)
            .select('numeroTicket nombreComprador emailComprador telefonoComprador tipoIdentificacionComprador numeroIdentificacionComprador rifaId estado')
            .populate('rifaId', 'nombreProducto')
            .sort({ numeroTicket: 1 }); // Ordenar por número de ticket (funciona con strings "0000" a "9999")

        console.log('Tickets encontrados en /api/tickets/consultar:', tickets);

        if (!tickets || tickets.length === 0) {
            let message = 'No se encontraron tickets para este correo electrónico.';
            if (rifaId) {
                message = `No se encontraron tickets para este correo electrónico en la rifa seleccionada.`;
            }
            return res.status(404).json({ message: message });
        }

        res.json({ message: 'Tickets encontrados exitosamente.', tickets: tickets });

    } catch (err) {
        console.error('Error al consultar tickets por email:', err);
        res.status(500).json({ message: 'Error interno del servidor al consultar tickets.', error: err.message });
    }
});


// NUEVA RUTA INTEGRADA: GET /api/tickets/consultar-por-numero/:numeroTicket
// Esta ruta consulta un ticket específico por su número de ticket Y el ID de la rifa
router.get('/consultar-por-numero/:numeroTicket', async (req, res) => {
    const { numeroTicket } = req.params; // Este numeroTicket ya viene formateado como "0000" desde el frontend
    const { rifaId } = req.query; 

    if (!rifaId) {
        return res.status(400).json({ message: 'Se requiere el rifaId para consultar el ticket por número.' });
    }

    try {
        const ticket = await Ticket.findOne({
            numeroTicket: numeroTicket, // Usar directamente el string formateado para la búsqueda
            rifaId: rifaId
        })
        .populate('rifaId', 'nombreProducto'); 

        if (!ticket) {
            return res.status(404).json({ message: `Ticket con número ${numeroTicket} no encontrado para la rifa especificada.` });
        }

        res.json({ message: 'Ticket encontrado exitosamente.', ticket: ticket });

    } catch (err) {
        console.error('Error al consultar ticket por número y rifaId:', err);
        res.status(500).json({ message: 'Error interno del servidor al consultar el ticket.', error: err.message });
    }
});


// 2. GET /api/tickets/:id (PROTEGIDA - Panel Admin)
router.get('/:id', protect, authorize(['admin']), async (req, res) => { 
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('rifaId')  
            .populate('metodoPagoId'); 
        if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado.' });
        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. GET /api/tickets/rifa/:rifaId (PROTEGIDA - Panel Admin)
router.get('/rifa/:rifaId', protect, authorize(['admin']), async (req, res) => { 
    try {
        const tickets = await Ticket.find({ rifaId: req.params.rifaId })
            .sort({ numeroTicket: 1 }); // Ordenar por número de ticket (funciona con strings "0000" a "9999")
        res.json(tickets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// 4. PATCH /api/tickets/:id (PROTEGIDA - Panel Admin para marcar como pagado/anulado)
router.patch('/:id', protect, authorize(['admin']), async (req, res) => { 
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado.' });

        if (req.body.estado != null) {
            if (!['disponible', 'pendiente_pago', 'pagado', 'anulado'].includes(req.body.estado)) { 
                return res.status(400).json({ message: 'Estado de ticket inválido.' });
            }
            ticket.estado = req.body.estado;
        }
        if (req.body.metodoPagoId != null) ticket.metodoPagoId = req.body.metodoPagoId;
        if (req.body.nombreComprador != null) ticket.nombreComprador = req.body.nombreComprador;
        if (req.body.emailComprador != null) ticket.emailComprador = req.body.emailComprador;
        if (req.body.telefonoComprador != null) ticket.telefonoComprador = req.body.telefonoComprador;
        if (req.body.tipoIdentificacionComprador != null) ticket.tipoIdentificacionComprador = req.body.tipoIdentificacionComprador;
        if (req.body.numeroIdentificacionComprador != null) ticket.numeroIdentificacionComprador = req.body.numeroIdentificacionComprador;


        const ticketActualizado = await ticket.save();
        res.json(ticketActualizado);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 5. DELETE /api/tickets/:id (PROTEGIDA - Con precaución, generalmente solo si es un error crítico)
router.delete('/:id', protect, authorize(['admin']), async (req, res) => { 
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado.' });

        await Ticket.deleteOne({ _id: req.params.id });
        res.json({ message: 'Ticket eliminado exitosamente.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
