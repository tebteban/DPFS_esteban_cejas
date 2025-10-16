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
    // La función 'destination' ya usa la ruta absoluta calculada
    destination: (req, file, cb) => cb(null, destFolder),
    
    // Genera un nombre de archivo único
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        // Nombre: timestamp + extensión
        cb(null, Date.now() + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Límite de 2MB
});

module.exports = upload;
