const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 1. Configurar el almacenamiento en disco
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // La carpeta de destino para los archivos subidos.
        // Asegúrate de que esta carpeta exista en la raíz de tu backend.
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Generar un nombre de archivo único para evitar colisiones
        // Usamos un ID universal y la extensión original del archivo
        const uniqueSuffix = uuidv4();
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

// 2. Definir un filtro de archivos para mayor seguridad
const fileFilter = (req, file, cb) => {
    // Aceptar solo imágenes y PDFs
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no soportado. Solo se permiten imágenes (JPEG, PNG) y PDFs.'), false);
    }
};

// 3. Crear el middleware de multer con la configuración
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        // Limitar el tamaño del archivo a 5MB
        fileSize: 1024 * 1024 * 5
    }
});

module.exports = upload;