const Rifa = require('../models/Rifa');
const Pago = require('../models/Pago');
const Ticket = require('../models/Ticket'); // Asegúrate de que este modelo está importado

// @desc    Obtener estadísticas generales para el dashboard
// @route   GET /api/dashboard/stats
// @access  Private (Admin)
const getDashboardStats = async (req, res) => {
    try {
        // --- Estadísticas de Rifas ---
        const totalRifas = await Rifa.countDocuments();
        const rifasActivas = await Rifa.countDocuments({ fechaInicio: { $lte: new Date() }, fechaFin: { $gte: new Date() }, activa: true });
        const rifasEnProgreso = await Rifa.countDocuments({ fechaInicio: { $lte: new Date() }, fechaFin: { $gte: new Date() } }); // Una rifa está en progreso si ya inició y no ha terminado
        const rifasFinalizadas = await Rifa.countDocuments({ fechaFin: { $lt: new Date() } }); // Finalizadas por fecha de fin

        // --- Estadísticas de Tickets ---
        const totalTicketsVendidos = await Pago.aggregate([
            { $match: { estado: 'verificado' } }, // Solo tickets de pagos verificados
            { $group: { _id: null, total: { $sum: '$cantidadTickets' } } }
        ]);
        const ticketsDisponibles = await Rifa.aggregate([
            { $match: { fechaFin: { $gte: new Date() } } }, // Solo rifas que no han terminado
            {
                $lookup: {
                    from: 'tickets', // la colección de tickets (en plural)
                    localField: '_id',
                    foreignField: 'rifa',
                    as: 'ticketsAsignados'
                }
            },
            {
                $project: {
                    totalTicketsRifa: '$cantidadNumeros', // Total de tickets que tiene la rifa
                    ticketsVendidosRifa: { $size: '$ticketsAsignados' } // Tickets ya asignados/vendidos para esa rifa
                }
            },
            {
                $project: {
                    _id: 0,
                    disponibles: { $subtract: ['$totalTicketsRifa', '$ticketsVendidosRifa'] }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$disponibles' }
                }
            }
        ]);

        // --- Nuevas Estadísticas para Gráficos ---
        // Ventas de Tickets por Rifa (solo de pagos verificados)
        const ticketsVendidosPorRifa = await Pago.aggregate([
            { $match: { estado: 'verificado' } },
            {
                $lookup: {
                    from: 'rifas', // Colección de rifas (en plural)
                    localField: 'rifa',
                    foreignField: '_id',
                    as: 'rifaInfo'
                }
            },
            { $unwind: '$rifaInfo' }, // Desestructura el array 'rifaInfo'
            {
                $group: {
                    _id: '$rifa', // Agrupa por el ID de la rifa
                    nombreRifa: { $first: '$rifaInfo.nombre' }, // Toma el nombre de la rifa
                    totalTickets: { $sum: '$cantidadTickets' } // Suma la cantidad de tickets
                }
            },
            { $sort: { totalTickets: -1 } }, // Opcional: ordenar por tickets vendidos
            { $limit: 5 } // Opcional: limitar a las 5 rifas principales
        ]);


        // --- Estadísticas de Pagos ---
        const pagosPendientes = await Pago.countDocuments({ estado: 'pendiente' });
        const pagosVerificados = await Pago.countDocuments({ estado: 'verificado' });
        const pagosRechazados = await Pago.countDocuments({ estado: 'rechazado' });

        const montoTotalUSD = await Pago.aggregate([
            { $match: { estado: 'verificado', moneda: 'USD' } },
            { $group: { _id: null, total: { $sum: '$montoTotal' } } }
        ]);
        const montoTotalVES = await Pago.aggregate([
            { $match: { estado: 'verificado', moneda: 'VES' } },
            { $group: { _id: null, total: { $sum: '$montoTotal' } } }
        ]);

        res.status(200).json({
            rifas: {
                total: totalRifas,
                activas: rifasActivas,
                enProgreso: rifasEnProgreso,
                finalizadas: rifasFinalizadas
            },
            tickets: {
                vendidos: totalTicketsVendidos.length > 0 ? totalTicketsVendidos[0].total : 0,
                disponibles: ticketsDisponibles.length > 0 ? ticketsDisponibles[0].total : 0,
            },
            pagos: {
                pendientes: pagosPendientes,
                verificados: pagosVerificados,
                rechazados: pagosRechazados,
                montoTotalUSD: montoTotalUSD.length > 0 ? montoTotalUSD[0].total : 0,
                montoTotalVES: montoTotalVES.length > 0 ? montoTotalVES[0].total : 0
            },
            // Añadimos los nuevos datos para gráficos aquí
            chartData: {
                ticketsVendidosPorRifa: ticketsVendidosPorRifa,
                // No necesitamos enviar los conteos de pagos por separado aquí
                // porque ya los tenemos en 'pagos', solo los usaremos directamente
            }
        });

    } catch (error) {
        console.error('Error al obtener estadísticas del dashboard:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener estadísticas.' });
    }
};

module.exports = {
    getDashboardStats
};