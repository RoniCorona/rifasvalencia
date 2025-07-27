// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin'); // Asegúrate de que esta ruta a tu modelo Admin sea correcta

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware de Autenticación para Proteger Rutas
exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);

            req.admin = await Admin.findById(decoded.id).select('-password');
            if (!req.admin) {
                return res.status(401).json({ message: 'No autorizado, token fallido o administrador no encontrado.' });
            }
            next();
        } catch (error) {
            console.error('Error de autenticación:', error);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expirado. Por favor, inicia sesión de nuevo.' });
            }
            res.status(401).json({ message: 'No autorizado, token fallido.' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'No autorizado, no hay token.' });
    }
};

// Middleware de Autorización por Roles
exports.authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (!req.admin || (roles.length > 0 && !roles.includes(req.admin.rol))) {
            return res.status(403).json({ message: `Usuario ${req.admin ? req.admin.email : 'desconocido'} no autorizado para acceder a esta ruta.` });
        }
        next();
    };
};