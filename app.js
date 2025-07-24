const express = require('express');
const path = require('path'); // Módulo para manejar rutas de archivos

const app = express();
const PORT = process.env.PORT || 3000;


// Esto le dice a Express que sirva los archivos estáticos desde la carpeta 'public'.
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para servir index.html (tu página principal)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Ruta para servir prod.html
app.get('/productos', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'productos.html'));
});

// Ruta para servir sign_in.html(inicio de sesion)
app.get('/sign_in', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'sign_in.html'));
});

// Ruta para servir register.html(registro de usuario)
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

// Ruta para servir cart.html(carrito de compras)
app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'cart.html'));
});

// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});