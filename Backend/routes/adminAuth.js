// backend/routes/adminAuth.js
const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin'); // Asegúrate de que esta ruta al modelo es correcta
const jwt = require('jsonwebtoken');
// ¡NUEVO! Importamos los middlewares de autenticación y autorización
const { protect, authorize } = require('../middleware/auth'); // Ajusta la ruta si es necesario

// --- Rutas de Autenticación para Administradores ---

// @route   POST /api/admin/register
// @desc    Registrar un nuevo administrador (ruta inicial, pública para el primer admin)
// @access  Public (para la creación inicial, luego se podría deshabilitar o proteger)
router.post('/register', async (req, res) => {
    console.log('--- Recibiendo solicitud POST /api/admin/register ---');
    const { nombre, email, password } = req.body;
    console.log('Datos de registro recibidos:', { nombre, email, password: password ? '*****' : 'No presente' });

    if (!nombre || !email || !password) {
        console.error('ERROR: Campos requeridos faltantes para el registro.');
        return res.status(400).json({ message: 'Por favor, introduce todos los campos requeridos.' });
    }

    try {
        console.log(`Buscando administrador con email: ${email}`);
        let admin = await Admin.findOne({ email });
        if (admin) {
            console.warn(`ADVERTENCIA: Intento de registro con email ya existente: ${email}`);
            return res.status(400).json({ message: 'El email ya está registrado.' });
        }
        console.log('Email no registrado, procediendo con la creación.');

        // Por defecto, el rol será 'admin' si no se especifica o si no quieres un superadmin inicial
        // Puedes agregar lógica aquí para el primer admin sea 'superadmin' si es el único.
        admin = new Admin({
            nombre,
            email,
            password, // La lógica para hashear la contraseña está en tu modelo Admin.js (pre-save hook)
            // rol: 'superadmin' // Descomenta y usa si quieres que el primer registro sea superadmin
        });

        console.log('Guardando nuevo administrador en la base de datos...');
        await admin.save();
        console.log('Administrador guardado exitosamente con ID:', admin._id);

        console.log('Generando token JWT...');
        const token = jwt.sign(
            { id: admin._id, rol: admin.rol }, // ¡Importante! Incluye el rol en el token
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRE_TIME || '1d' } 
        );
        console.log('Token JWT generado exitosamente.');

        res.status(201).json({
            message: 'Administrador registrado exitosamente.',
            token,
            admin: {
                id: admin._id,
                nombre: admin.nombre,
                email: admin.email,
                rol: admin.rol 
            }
        });
        console.log('Respuesta de registro enviada con éxito.');

    } catch (err) {
        console.error('FATAL ERROR al registrar administrador:', err);
        res.status(500).json({ message: 'Error interno del servidor al registrar administrador.', error: err.message });
    }
});

// @route   POST /api/admin/login
// @desc    Autenticar administrador y obtener token
// @access  Public
router.post('/login', async (req, res) => {
    console.log('--- Recibiendo solicitud POST /api/admin/login ---');
    const { email, password } = req.body;
    console.log('Datos de login recibidos:', { email, password: password ? '*****' : 'No presente' });

    if (!email || !password) {
        console.error('ERROR: Email o contraseña faltantes para el login.');
        return res.status(400).json({ message: 'Por favor, introduce el email y la contraseña.' });
    }

    try {
        console.log(`Buscando administrador con email: ${email}`);
        const admin = await Admin.findOne({ email });
        if (!admin) {
            console.warn(`ADVERTENCIA: Intento de login con email no encontrado: ${email}`);
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }
        console.log('Administrador encontrado en la base de datos.');

        console.log('Comparando contraseña...');
        const isMatch = await admin.matchPassword(password);
        if (!isMatch) {
            console.warn(`ADVERTENCIA: Contraseña incorrecta para el email: ${email}`);
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }
        console.log('Contraseña coincide exitosamente.');

        console.log('Generando token JWT...');
        const token = jwt.sign(
            { id: admin._id, rol: admin.rol }, // ¡Importante! Incluye el rol en el token
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_EXPIRE_TIME || '1d' } 
        );
        console.log('Token JWT generado exitosamente.');

        res.json({
            message: 'Inicio de sesión exitoso.',
            token,
            admin: {
                id: admin._id,
                nombre: admin.nombre,
                email: admin.email,
                rol: admin.rol 
            }
        });
        console.log('Respuesta de login enviada con éxito.');

    } catch (err) {
        console.error('FATAL ERROR al iniciar sesión (catch global):', err);
        res.status(500).json({ message: 'Error interno del servidor al iniciar sesión.', error: err.message });
    }
});

// ---
// ### Rutas para la Gestión de Otros Administradores (Protegidas)
// ---

// @route   POST /api/admin/register-new
// @desc    Permitir que un administrador existente cree un nuevo administrador
// @access  Private (Admin, Superadmin) - Solo administradores AUTORIZADOS pueden usar esto
router.post('/register-new', protect, authorize(['admin', 'superadmin']), async (req, res) => {
    console.log('--- Recibiendo solicitud POST /api/admin/register-new ---');
    // req.admin.id y req.admin.rol vienen del middleware 'protect'
    console.log(`Petición de ${req.admin.rol} con ID: ${req.admin.id} para registrar nuevo admin.`);

    const { nombre, email, password, rol } = req.body; // 'rol' puede venir si se permite asignar
    console.log('Datos de nuevo admin recibidos:', { nombre, email, password: password ? '*****' : 'No presente', rol });

    if (!nombre || !email || !password) {
        console.error('ERROR: Campos requeridos (nombre, email, password) faltantes para el registro del nuevo admin.');
        return res.status(400).json({ message: 'Por favor, introduce nombre, email y contraseña para el nuevo administrador.' });
    }

    // Opcional: Validar si el admin que crea es 'superadmin' para asignar el rol 'superadmin'
    // Si un 'admin' normal intenta crear un 'superadmin', podrías denegarlo o ignorar el rol y asignarle 'admin'
    let newAdminRole = 'admin'; // Rol por defecto
    if (rol && ['admin', 'superadmin'].includes(rol)) {
        if (req.admin.rol === 'superadmin') { // Solo superadmins pueden asignar el rol de superadmin
            newAdminRole = rol;
        } else if (rol === 'superadmin') {
            console.warn(`ADVERTENCIA: Admin normal (${req.admin.email}) intentó crear un superadmin. Asignando rol 'admin'.`);
            // return res.status(403).json({ message: 'Solo un superadministrador puede crear otros superadministradores.' });
        }
    }

    try {
        console.log(`Buscando si el email ${email} ya existe para el nuevo admin.`);
        let adminExists = await Admin.findOne({ email });
        if (adminExists) {
            console.warn(`ADVERTENCIA: Intento de registro de nuevo admin con email ya existente: ${email}`);
            return res.status(400).json({ message: 'El email para el nuevo administrador ya está registrado.' });
        }
        console.log('Email disponible para el nuevo administrador.');

        const newAdmin = new Admin({
            nombre,
            email,
            password,
            rol: newAdminRole // Asignar el rol (por defecto 'admin' o el especificado por superadmin)
        });

        console.log('Guardando nuevo administrador...');
        await newAdmin.save();
        console.log('Nuevo administrador creado exitosamente con ID:', newAdmin._id);

        res.status(201).json({
            message: 'Nuevo administrador creado exitosamente.',
            admin: {
                id: newAdmin._id,
                nombre: newAdmin.nombre,
                email: newAdmin.email,
                rol: newAdmin.rol
            }
        });

    } catch (err) {
        console.error('FATAL ERROR al crear nuevo administrador:', err);
        res.status(500).json({ message: 'Error interno del servidor al crear nuevo administrador.', error: err.message });
    }
});

// @route   GET /api/admin/users
// @desc    Obtener la lista de todos los administradores (sin la contraseña)
// @access  Private (Admin, Superadmin) - Solo administradores AUTORIZADOS pueden ver esto
router.get('/users', protect, authorize(['admin', 'superadmin']), async (req, res) => {
    console.log('--- Recibiendo solicitud GET /api/admin/users ---');
    console.log(`Petición de ${req.admin.rol} con ID: ${req.admin.id} para listar administradores.`);

    try {
        // Excluir el campo 'password' de la respuesta por seguridad
        const admins = await Admin.find().select('-password'); 
        console.log(`Se encontraron ${admins.length} administradores.`);
        res.status(200).json({ success: true, admins });

    } catch (err) {
        console.error('FATAL ERROR al obtener administradores:', err);
        res.status(500).json({ message: 'Error interno del servidor al obtener administradores.', error: err.message });
    }
});

// Puedes añadir rutas para actualizar y eliminar administradores aquí,
// también protegidas por 'protect' y 'authorize'

// Exportamos el router para que server.js lo monte directamente
module.exports = router;