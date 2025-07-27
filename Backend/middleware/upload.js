// middleware/upload.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Configuración de almacenamiento en disco
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Carpeta uploads/ en la raíz del proyecto
    const uploadDir = path.join(__dirname, '../uploads');
    // Crear la carpeta si no existe
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Obtener extensión y nombre base
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext)
      .replace(/\s+/g, '_')     // Reemplaza espacios por guiones bajos
      .replace(/[^\w\-]/g, '');  // Elimina caracteres no alfanuméricos
    // Generar nombre único: baseName-timestamp.ext
    cb(null, `${baseName}-${Date.now()}${ext}`);
  }
});

// 2. Filtro de tipos de archivo permitidos
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no soportado. Solo JPEG, PNG o PDF.'), false);
  }
};

// 3. Límite de tamaño (en bytes)
const limits = {
  fileSize: 10 * 1024 * 1024 // 10 MB
};

// 4. Exportar el middleware configurado
const upload = multer({
  storage,
  fileFilter,
  limits
});

module.exports = upload;
