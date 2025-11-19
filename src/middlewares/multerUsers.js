const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define la carpeta de destino usando path.resolve para asegurar una ruta absoluta
// Esto es crucial para que Express pueda servir la imagen correctamente desde 'public'.
const destFolder = path.resolve(__dirname, '../../public/img/users');

// Asegúrate de que la carpeta exista antes de intentar guardar
if (!fs.existsSync(destFolder)) {
    fs.mkdirSync(destFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, destFolder),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];


const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isValid = allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype);

    if (!isValid) {
      return cb(new Error('Solo se permiten imágenes JPG, JPEG, PNG o WEBP de hasta 2MB.'));
    }

    cb(null, true);
  }
});

module.exports = upload;
