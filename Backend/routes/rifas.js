// backend/routes/rifas.js
const express = require('express');
const router = express.Router();
const Rifa = require('../models/Rifa');
const Ticket = require('../models/Ticket'); 

const { protect, authorize } = require('../middleware/auth'); 

const { sendWinnerNotificationEmail } = require('../utils/emailService');

const formatTicketNumber = (num) => {
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

// --- Rutas (Endpoints) para la gestión de Rifas ---

// 1. GET /api/rifas
// Propósito: Obtener una lista de todas las rifas disponibles. (PÚBLICA)
// La lógica para la visibilidad en el frontend deberá considerar 'estaAbiertaParaVenta' y 'ticketsVendidos'
router.get('/', async (req, res) => {
    try {
        const rifas = await Rifa.find();
        console.log('Rifas obtenidas para la ruta pública /api/rifas:', rifas);
        res.json(rifas);
    } catch (err) {
        console.error('Error al obtener rifas públicas:', err);
        res.status(500).json({ message: 'Error interno del servidor al cargar las rifas.' });
    }
});

// 2. GET /api/rifas/:id
// Propósito: Obtener los detalles de una rifa específica por su ID. (PÚBLICA)
router.get('/:id', async (req, res) => {
    try {
        const rifa = await Rifa.findById(req.params.id);
        if (!rifa) return res.status(404).json({ message: 'Rifa no encontrada' });
        res.json(rifa);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. POST /api/rifas
// Propósito: Crear una nueva rifa. (PROTEGIDA - Solo Administradores)
router.post('/', protect, authorize(['admin']), async (req, res) => {
    const {
        nombreProducto,
        descripcion,
        imagenUrl,
        precioTicketUSD,
        tasaCambio,
        totalTickets,
        fechaInicioSorteo,
        fechaFin,
        fechaSorteo,
        estaAbiertaParaVenta // Puede venir en la creación, si no, toma el default del modelo
    } = req.body;

    console.log('Datos recibidos en el backend para crear rifa (después de desestructuración):', req.body);

    if (!nombreProducto || !descripcion || !imagenUrl || !precioTicketUSD || !tasaCambio || !totalTickets || !fechaInicioSorteo || !fechaFin) {
        return res.status(400).json({ message: 'Faltan campos obligatorios para crear la rifa.' });
    }

    const rifa = new Rifa({
        nombreProducto,
        descripcion,
        imagenUrl,
        precioTicketUSD,
        tasaCambio,
        totalTickets,
        fechaInicioSorteo,
        fechaFin,
        fechaSorteo,
        estaAbiertaParaVenta: estaAbiertaParaVenta !== undefined ? estaAbiertaParaVenta : true // Asigna si viene, sino default
    });

    try {
        const nuevaRifa = await rifa.save();

        // --- Lógica: Generar Tickets Individuales para la Rifa con los nombres originales ---
        const generatedTickets = [];
        // ¡AJUSTE! Generar tickets del 0 al totalTickets - 1
        for (let i = 0; i < nuevaRifa.totalTickets; i++) { // Bucle de 0 a totalTickets-1
            const numeroFormatted = formatTicketNumber(i); // Formatea el número (ej: 0 -> "0000")
            generatedTickets.push({
                rifaId: nuevaRifa._id,
                numeroTicket: numeroFormatted,
                estado: 'disponible', 
            });
        }
        await Ticket.insertMany(generatedTickets);
        console.log(`Se generaron ${generatedTickets.length} tickets para la nueva rifa: ${nuevaRifa.nombreProducto} (ID: ${nuevaRifa._id})`);
        // --- FIN LÓGICA ---

        res.status(201).json(nuevaRifa);
    } catch (err) {
        console.error('Error al crear la rifa en el backend:', err);
        res.status(400).json({ message: err.message, errors: err.errors }); 
    }
});

// 4. PATCH /api/rifas/:id
// Propósito: Actualizar parcialmente una rifa existente. (PROTEGIDA - Solo Administradores)
router.patch('/:id', protect, authorize(['admin']), async (req, res) => {
    try {
        const rifa = await Rifa.findById(req.params.id);
        if (!rifa) return res.status(404).json({ message: 'Rifa no encontrada' });

        const oldTotalTickets = rifa.totalTickets; 

        if (req.body.nombreProducto != null) rifa.nombreProducto = req.body.nombreProducto;
        if (req.body.descripcion != null) rifa.descripcion = req.body.descripcion;
        if (req.body.imagenUrl != null) rifa.imagenUrl = req.body.imagenUrl;
        if (req.body.precioTicketUSD != null) rifa.precioTicketUSD = req.body.precioTicketUSD;
        if (req.body.tasaCambio != null) rifa.tasaCambio = req.body.tasaCambio;
        if (req.body.totalTickets != null) rifa.totalTickets = req.body.totalTickets;
        if (req.body.ticketsVendidos != null) rifa.ticketsVendidos = req.body.ticketsVendidos;
        if (req.body.fechaInicioSorteo != null) rifa.fechaInicioSorteo = req.body.fechaInicioSorteo;
        if (req.body.fechaFin != null) rifa.fechaFin = req.body.fechaFin;
        if (req.body.fechaSorteo != null) rifa.fechaSorteo = req.body.fechaSorteo;
        if (req.body.estado != null) rifa.estado = req.body.estado;
        // ¡NUEVO! Actualizar el estado manual si se proporciona
        if (req.body.estaAbiertaParaVenta != null) rifa.estaAbiertaParaVenta = req.body.estaAbiertaParaVenta;


        const rifaActualizada = await rifa.save();

        // --- Lógica para ajustar tickets si totalTickets ha cambiado ---
        // ¡AJUSTE! Generar tickets del 0 al totalTickets - 1
        if (rifaActualizada.totalTickets > oldTotalTickets) {
            const newTicketsToGenerate = [];
            // El bucle empieza desde el 'oldTotalTickets' (que era el total de tickets antes del cambio)
            // y va hasta el nuevo 'totalTickets - 1'.
            // Ejemplo: si oldTotalTickets era 10000 (0-9999) y ahora es 12000 (0-11999)
            // el bucle irá de 10000 a 11999
            for (let i = oldTotalTickets; i < rifaActualizada.totalTickets; i++) { // Bucle de oldTotalTickets a newTotalTickets-1
                const numeroFormatted = formatTicketNumber(i); // Formatea el número
                newTicketsToGenerate.push({
                    rifaId: rifaActualizada._id,
                    numeroTicket: numeroFormatted,
                    estado: 'disponible',
                });
            }
            if (newTicketsToGenerate.length > 0) {
                await Ticket.insertMany(newTicketsToGenerate);
                console.log(`Se generaron ${newTicketsToGenerate.length} tickets adicionales para la rifa ${rifaActualizada.nombreProducto}`);
            }
        }
        // --- Fin lógica ajuste tickets ---

        res.json(rifaActualizada);
    } catch (err) {
        console.error('Error al actualizar rifa:', err); 
        res.status(400).json({ message: err.message });
    }
});

// ¡NUEVA RUTA! PATCH /api/rifas/:id/toggle-venta-manual
// Propósito: Cambiar el estado manual de venta de una rifa (abierta/cerrada).
// @access PROTEGIDA - Solo Administradores
router.patch('/:id/toggle-venta-manual', protect, authorize(['admin']), async (req, res) => {
    try {
        const rifaId = req.params.id;
        // Esperamos el nuevo estado booleano en el cuerpo de la petición
        const { estaAbiertaParaVenta } = req.body; 

        if (typeof estaAbiertaParaVenta !== 'boolean') {
            return res.status(400).json({ message: 'El campo estaAbiertaParaVenta es obligatorio y debe ser un booleano.' });
        }

        const rifa = await Rifa.findById(rifaId);
        if (!rifa) {
            return res.status(404).json({ message: 'Rifa no encontrada.' });
        }

        // Actualiza el campo estaAbiertaParaVenta
        rifa.estaAbiertaParaVenta = estaAbiertaParaVenta;
        await rifa.save();

        res.json({ 
            message: `Estado de venta de la rifa actualizado a ${estaAbiertaParaVenta ? 'Abierta' : 'Cerrada'} manualmente.`,
            rifa: rifa // Devuelve la rifa actualizada para que el frontend pueda refrescar su estado
        });

    } catch (err) {
        console.error('Error al cambiar el estado manual de venta de la rifa:', err);
        res.status(500).json({ message: 'Error interno del servidor al actualizar el estado de la rifa.', error: err.message });
    }
});


// 5. DELETE /api/rifas/:id
// Propósito: Eliminar una rifa. (PROTEGIDA - Solo Administradores)
router.delete('/:id', protect, authorize(['admin']), async (req, res) => {
    try {
        const rifa = await Rifa.findById(req.params.id);
        if (!rifa) return res.status(404).json({ message: 'Rifa no encontrada' });

        // Antes de eliminar la rifa, eliminar todos los tickets asociados a ella.
        await Ticket.deleteMany({ rifaId: req.params.id });
        console.log(`Se eliminaron todos los tickets asociados a la rifa ${req.params.id}`);

        await Rifa.deleteOne({ _id: req.params.id });
        res.json({ message: 'Rifa eliminada exitosamente' });
    } catch (err) {
        console.error('Error al eliminar rifa:', err); 
        res.status(500).json({ message: err.message });
    }
});

// 6. POST /api/rifas/:id/sortear
// Propósito: Realizar el sorteo manual para una rifa específica. (PROTEGIDA - Solo Administradores)
router.post('/:id/sortear', protect, authorize(['admin']), async (req, res) => {
    const rifaId = req.params.id;
    const { numberOfWinners = { "primer_lugar": 1 } } = req.body;

    try {
        const rifa = await Rifa.findById(rifaId);
        if (!rifa) {
            return res.status(404).json({ message: 'Rifa no encontrada.' });
        }
        if (rifa.sorteada) {
            return res.status(400).json({ message: 'Esta rifa ya ha sido sorteada.' });
        }
        if (rifa.ticketsVendidos === 0) { 
            return res.status(400).json({ message: 'No hay tickets vendidos para realizar el sorteo.' });
        }

        const ticketsPagados = await Ticket.find({ rifaId: rifa._id, estado: 'pagado' });

        if (ticketsPagados.length === 0) {
            return res.status(400).json({ message: 'No hay tickets pagados para realizar el sorteo.' });
        }

        let ganadoresSeleccionados = [];
        let ticketsDisponiblesParaSorteo = [...ticketsPagados]; 
        let lugaresOrden = Object.keys(numberOfWinners);

        const ordenPrioridad = { 'primer_lugar': 1, 'segundo_lugar': 2, 'tercer_lugar': 3, 'cuarto_lugar': 4, 'quinto_lugar': 5 };
        lugaresOrden.sort((a, b) => (ordenPrioridad[a] || Infinity) - (ordenPrioridad[b] || Infinity));


        for (const lugar of lugaresOrden) {
            const cantidadParaEsteLugar = numberOfWinners[lugar];

            for (let i = 0; i < cantidadParaEsteLugar; i++) {
                if (ticketsDisponiblesParaSorteo.length === 0) {
                    break; 
                }

                const indiceGanador = Math.floor(Math.random() * ticketsDisponiblesParaSorteo.length);
                const ticketGanador = ticketsDisponiblesParaSorteo[indiceGanador];

                ganadoresSeleccionados.push({
                    posicion: lugar, 
                    numeroGanador: ticketGanador.numeroTicket,
                    idComprador: ticketGanador.comprador, 
                    nombreGanador: ticketGanador.nombreComprador,
                    emailGanador: ticketGanador.emailComprador,
                    telefonoGanador: ticketGanador.telefonoComprador,
                    fechaSorteo: new Date()
                });

                ticketsDisponiblesParaSorteo.splice(indiceGanador, 1); 
            }
        }

        rifa.ganadores = ganadoresSeleccionados;
        rifa.estado = 'sorteada'; 
        rifa.sorteada = true; 
        rifa.fechaSorteo = new Date(); 

        await rifa.save();

        for (const ganador of ganadoresSeleccionados) {
            // sendWinnerNotificationEmail(ganador, rifa); 
            console.log(`Ganador seleccionado para ${rifa.nombreProducto} (${ganador.posicion}): ${ganador.nombreGanador} con el número ${ganador.numeroGanador}`);
        }

        res.json({
            message: 'Sorteo realizado exitosamente.',
            rifa: rifa,
            ganadores: ganadoresSeleccionados
        });

    } catch (err) {
        console.error('Error al realizar el sorteo:', err);
        res.status(500).json({ message: 'Error interno del servidor al realizar el sorteo.', error: err.message });
    }
});


module.exports = router;
