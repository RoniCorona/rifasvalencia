const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Librería para encriptar contraseñas

const adminSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // Cada email debe ser único
        lowercase: true,
        trim: true,
        match: [/.+@.+\..+/, 'Por favor, introduce un correo electrónico válido']
    },
    password: { // Aquí guardaremos la contraseña encriptada
        type: String,
        required: true
    },
    rol: { // Para futuros niveles de acceso (ej. superadmin, editor)
        type: String,
        enum: ['superadmin', 'admin'],
        default: 'admin'
    }
}, {
    timestamps: true
});

// Middleware (función que se ejecuta antes de guardar) para encriptar la contraseña
adminSchema.pre('save', async function(next) {
    // Solo encripta la contraseña si ha sido modificada (o es nueva)
    if (!this.isModified('password')) {
        return next();
    }
    // Genera un "salt" (cadena aleatoria) para la encriptación
    const salt = await bcrypt.genSalt(10);
    // Encripta la contraseña usando el salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Método para comparar la contraseña ingresada con la contraseña encriptada en la DB
adminSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;