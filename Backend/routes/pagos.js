// backend/routes/pagos.js
const express = require('express');
const router = express.Router();
const Pago = require('../models/Pago');
const Ticket = require('../models/Ticket');
const Rifa = require('../models/Rifa');
const TasaCambio = require('../models/TasaCambio');
// Importar 'fs' y 'path' para manejar el borrado de archivos en el servidor
const fs = require('fs');
const path = require('path');
// Importar el middleware de subida que debes haber configurado
const upload = require('../utils/upload');

const { protect, authorize } = require('../middleware/auth');

const { sendTicketConfirmationEmail } = require('../utils/emailService');

// Función para formatear el número de ticket a 4 dígitos (ej: 1 -> "0001", 0 -> "0000")
const formatTicketNumber = (num) => {
    // Asegura que el número se formatee con ceros a la izquierda para 4 dígitos
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

// --- Rutas (Endpoints) para la gestión de Pagos ---

// @desc    Registrar un nuevo pago (inicialmente "pendiente") con tickets aleatorios
// @route   POST /api/pagos
// @access  Public (Debería ser pública si los clientes registran sus pagos)
// Agregamos el middleware de subida de archivos aquí. 'comprobante' es el nombre del campo del archivo.
router.post('/', upload.single('comprobante'), async (req, res) => {
    console.log('--- Recibiendo solicitud POST /api/pagos ---');
    console.log('Body recibido:', req.body);
    // req.file contiene la información del archivo subido por Multer
    console.log('Archivo recibido (si aplica):', req.file);

    const {
        rifaId,
        cantidadTickets,
        montoTotal,
        moneda,
        metodo,
        referenciaPago,
        nombreComprador,
        emailComprador,
        telefonoComprador,
        tipoIdentificacionComprador,
        numeroIdentificacionComprador,
        tasaCambioUsada
    } = req.body;

    // La URL del comprobante se obtiene del archivo subido por Multer, no del body.
    const comprobanteUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Validaciones de negocio mejoradas
    if (!rifaId || !cantidadTickets || !montoTotal || !moneda || !metodo || !nombreComprador || !emailComprador || !telefonoComprador) {
        console.error('ERROR: Faltan campos obligatorios para crear el pago.');
        // Si el archivo se subió pero faltan datos del body, lo borramos.
        if (req.file) {
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error("Error al eliminar comprobante fallido del servidor:", unlinkErr);
            });
        }
        return res.status(400).json({ message: 'Faltan campos obligatorios para registrar el pago y asignar tickets.' });
    }

    // Si no hay referencia de pago, se exige un comprobante.
    if (!referenciaPago && !comprobanteUrl) {
        console.error('ERROR: Ni referencia de pago ni comprobante proporcionados.');
        return res.status(400).json({ message: 'Se requiere una referencia de pago o un comprobante.' });
    }

    if (parseFloat(montoTotal) <= 0) {
        console.error('ERROR: El monto total debe ser un valor positivo.');
        return res.status(400).json({ message: 'El monto total debe ser un valor positivo.' });
    }
    if (parseInt(cantidadTickets) <= 0) {
        console.error('ERROR: La cantidad de tickets debe ser al menos 1.');
        return res.status(400).json({ message: 'La cantidad de tickets debe ser al menos 1.' });
    }

    try {
        // 1. Buscar la rifa
        console.log(`Buscando rifa con ID: ${rifaId}`);
        const rifaExistente = await Rifa.findById(rifaId);
        if (!rifaExistente) {
            console.error('ERROR: Rifa asociada al pago no encontrada.');
            return res.status(404).json({ message: 'Rifa asociada al pago no encontrada.' });
        }
        if (rifaExistente.estado !== 'activa') {
            console.error('ERROR: La rifa no está activa para la compra de tickets.');
            return res.status(400).json({ message: 'La rifa no está activa para la compra de tickets.' });
        }
        console.log('Rifa encontrada:', rifaExistente.nombreProducto);

        // 2. Verificar disponibilidad de tickets
        const ticketsDisponiblesParaComprar = rifaExistente.totalTickets - rifaExistente.ticketsVendidos;
        console.log(`Tickets disponibles en la rifa: ${ticketsDisponiblesParaComprar}, Cantidad solicitada: ${cantidadTickets}`);
        if (cantidadTickets > ticketsDisponiblesParaComprar) {
            console.error('ERROR: No hay suficientes tickets disponibles.');
            return res.status(400).json({ message: `Solo quedan ${ticketsDisponiblesParaComprar} tickets disponibles para esta rifa.` });
        }

        // 3. Generar y asignar números de tickets de forma aleatoria
        console.log('Buscando tickets disponibles para la rifa en la colección Ticket...');

        // Paso A: Obtener todos los tickets disponibles
        const todosLosTicketsDisponibles = await Ticket.find({
            rifaId: rifaId,
            estado: 'disponible'
        }).select('_id numeroTicket');

        console.log(`Encontrados ${todosLosTicketsDisponibles.length} tickets en estado 'disponible'.`);

        if (todosLosTicketsDisponibles.length < cantidadTickets) {
            console.error('ERROR: No hay suficientes tickets disponibles en DB.');
            return res.status(400).json({ message: `No hay suficientes tickets disponibles en esta rifa. Solo se pudieron reservar ${todosLosTicketsDisponibles.length}.` });
        }
        
        // Paso B: Mezclar aleatoriamente el array de tickets disponibles
        const ticketsMezclados = shuffleArray(todosLosTicketsDisponibles);

        // Paso C: Tomar solo la cantidad de tickets solicitada del array mezclado
        const ticketsParaAsignar = ticketsMezclados.slice(0, cantidadTickets);

        const ticketsIdsParaActualizar = ticketsParaAsignar.map(t => t._id);
        const numerosTicketsAsignados = ticketsParaAsignar.map(t => t.numeroTicket);

        console.log('Tickets seleccionados para asignación:', numerosTicketsAsignados);

        // 4. Lógica para calcular y almacenar montos y tasa de cambio
        let montoEnUSD = 0;
        let montoEnVES = 0;
        let tasaDeCambioActual = rifaExistente.tasaCambio;

        if (!tasaDeCambioActual || tasaDeCambioActual <= 0) {
            console.warn('Advertencia: La rifa no tiene una tasa de cambio válida. Intentando obtener la última de TasaCambio.');
            const ultimaTasa = await TasaCambio.findOne().sort({ fecha: -1 });
            if (!ultimaTasa || ultimaTasa.valor <= 0) {
                console.error('ERROR: No se pudo obtener una tasa de cambio válida. Asegúrate de que una tasa esté registrada y sea mayor que cero en la base de datos.');
                return res.status(500).json({ message: 'No se pudo obtener una tasa de cambio válida. Asegúrate de que una tasa esté registrada y sea mayor que cero en la base de datos.' });
            }
            tasaDeCambioActual = ultimaTasa.valor;
        }
        console.log('Tasa de cambio final usada:', tasaDeCambioActual);

        if (moneda === 'USD') {
            montoEnUSD = parseFloat(montoTotal);
            montoEnVES = montoEnUSD * tasaDeCambioActual;
        } else { // moneda === 'VES'
            montoEnVES = parseFloat(montoTotal);
            montoEnUSD = montoEnVES / tasaDeCambioActual;
        }
        console.log(`Monto Original: ${montoTotal} ${moneda}, Monto USD: ${montoEnUSD.toFixed(2)}, Monto VES: ${montoEnVES.toFixed(2)}`);

        // 5. Crear el nuevo pago
        console.log('Creando nuevo documento de Pago...');
        const nuevoPago = new Pago({
            rifa: rifaId,
            cantidadTickets,
            montoTotal: parseFloat(montoTotal),
            moneda,
            montoTotalUSD: montoEnUSD.toFixed(2),
            montoTotalVES: montoEnVES.toFixed(2),
            tasaCambioUsada: tasaDeCambioActual.toFixed(2),
            metodo,
            referenciaPago: referenciaPago || null,
            comprobanteUrl: comprobanteUrl, // Se guarda la URL si se subió el archivo
            comprador: {
                nombre: nombreComprador,
                email: emailComprador,
                telefono: telefonoComprador,
                tipoIdentificacion: tipoIdentificacionComprador || null,
                numeroIdentificacion: numeroIdentificacionComprador || null,
            },
            numerosTicketsAsignados: numerosTicketsAsignados, // Guardar los números asignados
            fechaPago: new Date(),
            estado: 'pendiente'
        });

        const pagoGuardado = await nuevoPago.save();
        console.log('Pago guardado exitosamente con ID:', pagoGuardado._id);

        // 6. Actualizar el estado de los tickets y la rifa
        await Ticket.updateMany(
            { _id: { $in: ticketsIdsParaActualizar }, estado: 'disponible' },
            {
                $set: {
                    estado: 'pendiente_pago',
                    emailComprador: emailComprador,
                    nombreComprador: nombreComprador,
                    telefonoComprador: telefonoComprador,
                    tipoIdentificacionComprador: tipoIdentificacionComprador || null,
                    numeroIdentificacionComprador: numeroIdentificacionComprador || null,
                    metodoPagoId: pagoGuardado._id,
                    fechaCompra: new Date()
                }
            }
        );

        await Rifa.findByIdAndUpdate(
            rifaId,
            {
                $inc: { ticketsVendidos: cantidadTickets },
                $push: {
                    numerosTickets: {
                        $each: ticketsParaAsignar.map(ticket => ({
                            numeroTicket: ticket.numeroTicket,
                            comprador: null,
                            nombreComprador: nombreComprador,
                            fechaCompra: new Date(),
                            estadoPago: 'pendiente',
                        }))
                    }
                }
            },
            { new: true }
        );

        // Respuesta para el frontend
        console.log('Enviando respuesta exitosa al frontend.');
        res.status(201).json({
            message: 'Pago registrado y tickets asignados exitosamente.',
            pago: pagoGuardado,
            // Aseguramos que los números se envían formateados y ordenados numéricamente
            numerosTicketsAsignados: pagoGuardado.numerosTicketsAsignados.sort((a, b) => parseInt(a, 10) - parseInt(b, 10)),
            nombreComprador: pagoGuardado.comprador.nombre,
            emailComprador: pagoGuardado.comprador.email,
            telefonoComprador: pagoGuardado.comprador.telefono,
            tipoIdentificacionComprador: pagoGuardado.comprador.tipoIdentificacion,
            numeroIdentificacionComprador: pagoGuardado.comprador.numeroIdentificacion,
            metodo: pagoGuardado.metodo,
            cantidadTickets: pagoGuardado.cantidadTickets,
        });

    } catch (err) {
        // MANEJO DE ERRORES ROBUSTO: Si la base de datos falla después de la subida del archivo, lo borramos.
        if (req.file) {
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error("Error al eliminar comprobante fallido del servidor:", unlinkErr);
            });
        }
        if (err.code === 11000) {
            console.error('ERROR: Error de duplicado (11000) - referenciaPago ya existe o problema con tickets asignados.', err);
            return res.status(409).json({ message: 'Ya existe un pago con esta referencia o hay un problema con la asignación de tickets. Por favor, verifica tu información o inténtalo de nuevo.', field: 'referenciaPago' });
        }
        console.error('FATAL ERROR al registrar pago (catch global):', err);
        res.status(500).json({ message: 'Error interno del servidor al registrar pago.', error: err.message, stack: err.stack });
    }
});


// @desc    Obtener todos los pagos (para el panel de administración, con filtros y paginación)
// @route   GET /api/pagos
// @access  Private (Admin)
router.get('/', protect, authorize(['admin']), async (req, res) => {
    try {
        let query = {};

        if (req.query.rifaId) {
            query.rifa = req.query.rifaId;
        }

        if (req.query.estado) {
            query.estado = req.query.estado;
        }

        if (req.query.searchTerm) {
            const regex = new RegExp(req.query.searchTerm, 'i');
            query.$or = [
                { referenciaPago: regex },
                { 'comprador.nombre': regex },
                { 'comprador.email': regex },
                { 'comprador.numeroIdentificacion': regex },
                { 'comprador.telefono': regex }
            ];
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const pagos = await Pago.find(query)
            .populate('rifa', 'nombreProducto')
            .sort({ fechaPago: -1 })
            .skip(skip)
            .limit(limit);

        const totalPagos = await Pago.countDocuments(query);

        res.json({
            total: totalPagos,
            page,
            limit,
            pagos
        });
    } catch (err) {
        console.error('Error al obtener pagos:', err.message);
        res.status(500).json({ message: 'Error del servidor al obtener pagos.' });
    }
});

// @desc    Obtener un pago específico por ID
// @route   GET /api/pagos/:id
// @access  Private (Admin)
router.get('/:id', protect, authorize(['admin']), async (req, res) => {
    try {
        const pago = await Pago.findById(req.params.id)
            .populate('rifa', 'nombreProducto');
        if (!pago) {
            return res.status(404).json({ message: 'Pago no encontrado.' });
        }
        res.json(pago);
    } catch (err) {
        console.error('Error al obtener pago por ID:', err.message);
        res.status(500).json({ message: 'Error del servidor al obtener el pago.' });
    }
});

// @desc    Verificar un pago
// @route   PATCH /api/pagos/:id/verificar
// @access  Private (Admin)
router.patch('/:id/verificar', protect, authorize(['admin']), async (req, res) => {
    try {
        console.log(`[VERIFY PAYMENT] Attempting to find payment with ID: ${req.params.id}`);
        const pago = await Pago.findById(req.params.id);

        if (!pago) {
            console.warn(`[VERIFY PAYMENT] Payment with ID: ${req.params.id} not found.`);
            return res.status(404).json({ message: 'Pago no encontrado.' });
        }

        if (pago.estado === 'verificado') {
            console.warn(`[VERIFY PAYMENT] Payment ${pago._id} already verified.`);
            return res.status(400).json({ message: 'Este pago ya ha sido verificado.' });
        }
        if (pago.estado === 'rechazado') {
            console.warn(`[VERIFY PAYMENT] Payment ${pago._id} was rejected. Cannot verify directly.`);
            return res.status(400).json({ message: 'Este pago fue rechazado. No se puede verificar directamente.' });
        }

        console.log(`[VERIFY PAYMENT] Updating payment ${pago._id} status to 'verificado'.`);
        pago.estado = 'verificado';
        pago.notasAdministrador = req.body.notasAdministrador || '';

        console.log(`[VERIFY PAYMENT] Marking tickets for payment ${pago._id} as 'pagado'.`);
        // Marcar los tickets como 'pagado'
        await Ticket.updateMany(
            {
                rifaId: pago.rifa,
                numeroTicket: { $in: pago.numerosTicketsAsignados },
                estado: 'pendiente_pago'
            },
            { $set: { estado: 'pagado' } }
        );
        console.log(`[VERIFY PAYMENT] Tickets ${pago.numerosTicketsAsignados.join(', ')} para rifa ${pago.rifa} marcados como 'pagado'.`);

        console.log(`[VERIFY PAYMENT] Updating Rifa.numerosTickets subdocuments estadoPago to 'pagado'.`);
        // Asegúrate de que los números en numerosTicketsAsignados sean strings para la comparación
        await Rifa.findByIdAndUpdate(
            pago.rifa,
            { $set: { 'numerosTickets.$[elem].estadoPago': 'pagado' } },
            { arrayFilters: [{ 'elem.numeroTicket': { $in: pago.numerosTicketsAsignados } }], new: true }
        );


        console.log(`[VERIFY PAYMENT] Saving updated payment ${pago._id}.`);
        const pagoActualizado = await pago.save();
        console.log(`[VERIFY PAYMENT] Payment ${pagoActualizado._id} saved successfully.`);

        console.log(`[VERIFY PAYMENT] Finding associated rifa for payment ${pago._id}.`);
        const rifaAsociada = await Rifa.findById(pago.rifa);
        console.log(`[VERIFY PAYMENT] Rifa associated: ${rifaAsociada ? rifaAsociada.nombreProducto : 'Not Found'}`);

        console.log(`[VERIFY PAYMENT] Finding paid tickets for payment ${pago._id}.`);
        const ticketsPagadosDelComprador = await Ticket.find({
            rifaId: pago.rifa,
            numeroTicket: { $in: pago.numerosTicketsAsignados },
            estado: 'pagado'
        });
        console.log(`[VERIFY PAYMENT] Found ${ticketsPagadosDelComprador.length} paid tickets for email confirmation.`);

        if (rifaAsociada && ticketsPagadosDelComprador.length > 0) {
            console.log(`[VERIFY PAYMENT] Attempting to send confirmation email to ${pago.comprador.email}.`);
            await sendTicketConfirmationEmail(
                pago.comprador.email,
                pago.comprador.nombre,
                rifaAsociada,
                ticketsPagadosDelComprador
            );
            console.log(`[VERIFY PAYMENT] Confirmation email sent to ${pago.comprador.email} for rifa ${rifaAsociada.nombreProducto}.`);
        } else {
            console.warn(`[VERIFY PAYMENT] Could not send confirmation email: Rifa or tickets not found for payment ${pago._id}`);
        }

        console.log(`[VERIFY PAYMENT] Responding with success for payment ${pagoActualizado._id}.`);
        res.json({ message: 'Pago verificado exitosamente', pago: pagoActualizado });
    } catch (err) {
        console.error('FATAL ERROR al verificar pago (catch global):', err); // Log the full error object for detailed debugging
        res.status(500).json({ message: 'Error del servidor al verificar el pago.', error: err.message, stack: err.stack });
    }
});

// @desc    Rechazar un pago
// @route   PATCH /api/pagos/:id/rechazar
// @access  Private (Admin)
router.patch('/:id/rechazar', protect, authorize(['admin']), async (req, res) => {
    try {
        const pago = await Pago.findById(req.params.id);

        if (!pago) {
            return res.status(404).json({ message: 'Pago no encontrado.' });
        }

        if (pago.estado === 'rechazado') {
            return res.status(400).json({ message: 'Este pago ya ha sido rechazado.' });
        }
        if (pago.estado === 'verificado') {
            return res.status(400).json({ message: 'Este pago ya fue verificado. No se puede rechazar directamente.' });
        }

        pago.estado = 'rechazado';
        pago.notasAdministrador = req.body.notasAdministrador || '';

        // Liberar los tickets marcándolos como 'disponible'
        await Ticket.updateMany(
            {
                rifaId: pago.rifa,
                numeroTicket: { $in: pago.numerosTicketsAsignados },
                estado: 'pendiente_pago'
            },
            {
                $set: {
                    estado: 'disponible',
                    emailComprador: null,
                    nombreComprador: null,
                    telefonoComprador: null,
                    tipoIdentificacionComprador: null,
                    numeroIdentificacionComprador: null,
                    metodoPagoId: null,
                    fechaCompra: null
                }
            }
        );
        console.log(`Tickets ${pago.numerosTicketsAsignados.join(', ')} para rifa ${pago.rifa} liberados por rechazo de pago.`);

        console.log(`[REJECT PAYMENT] Pulling tickets from Rifa.numerosTickets for payment ${pago._id}.`);
        await Rifa.findByIdAndUpdate(
            pago.rifa,
            {
                $pull: { 'numerosTickets': { numeroTicket: { $in: pago.numerosTicketsAsignados } } },
                $inc: { ticketsVendidos: -pago.cantidadTickets }
            },
            { new: true }
        );
        console.log(`[REJECT PAYMENT] Rifa ${pago.rifa} updated.`);


        const pagoActualizado = await pago.save();

        // Si el pago tenía un comprobante, eliminarlo también del servidor
        if (pago.comprobanteUrl) {
            const filePath = path.join(__dirname, '..', pago.comprobanteUrl);
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) console.error("Error al eliminar el comprobante rechazado del servidor:", unlinkErr);
            });
        }

        res.json({ message: 'Pago rechazado exitosamente', pago: pagoActualizado });
    } catch (err) {
        console.error('Error al rechazar pago:', err.message);
        res.status(500).json({ message: 'Error del servidor al rechazar el pago.' });
    }
});

// @desc    Eliminar un registro de pago.
// @route   DELETE /api/pagos/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize(['admin']), async (req, res) => {
    try {
        const pago = await Pago.findById(req.params.id);
        if (!pago) return res.status(404).json({ message: 'Pago no encontrado.' });

        // Guardar la rifaId y cantidadTickets antes de eliminar el pago
        const rifaId = pago.rifa;
        const cantidadTicketsEliminados = pago.cantidadTickets;

        // Liberar los tickets
        if (pago.estado === 'verificado' || pago.estado === 'pendiente') {
            await Ticket.updateMany(
                {
                    rifaId: rifaId,
                    numeroTicket: { $in: pago.numerosTicketsAsignados },
                    metodoPagoId: pago._id
                },
                { $set: {
                    estado: 'disponible',
                    emailComprador: null,
                    nombreComprador: null,
                    telefonoComprador: null,
                    tipoIdentificacionComprador: null,
                    numeroIdentificacionComprador: null,
                    metodoPagoId: null,
                    fechaCompra: null
                } }
            );
            console.log(`Tickets ${pago.numerosTicketsAsignados.join(', ')} para rifa ${rifaId} liberados antes de eliminar el pago.`);
        }

        await Pago.deleteOne({ _id: req.params.id });
        console.log(`Pago ${req.params.id} eliminado exitosamente.`);

        if (pago.estado === 'verificado' || pago.estado === 'pendiente') {
            console.log(`[DELETE PAYMENT] Pulling tickets from Rifa.numerosTickets for payment ${pago._id}.`);
            const rifaActualizada = await Rifa.findByIdAndUpdate(
                rifaId,
                {
                    $inc: { ticketsVendidos: -cantidadTicketsEliminados },
                    $pull: { 'numerosTickets': { numeroTicket: { $in: pago.numerosTicketsAsignados } } }
                },
                { new: true }
            );
            console.log(`Rifa ${rifaId} actualizada después de eliminar pago. Nuevos tickets vendidos: ${rifaActualizada.ticketsVendidos}`);
        } else {
            console.log(`El pago ${pago._id} estaba en estado '${pago.estado}'. No se ajustaron los tickets vendidos en la rifa.`);
        }

        // Si el pago tenía un comprobante, eliminarlo también del servidor
        if (pago.comprobanteUrl) {
            const filePath = path.join(__dirname, '..', pago.comprobanteUrl);
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) console.error("Error al eliminar el comprobante del servidor:", unlinkErr);
            });
        }

        res.json({ message: 'Pago eliminado exitosamente y tickets de rifa revertidos.' });
    } catch (err) {
        console.error('Error al eliminar pago:', err.message);
        res.status(500).json({ message: 'Error del servidor al eliminar el pago.' });
    }
});

module.exports = router;