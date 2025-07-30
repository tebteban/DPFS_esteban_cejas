const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configura EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para procesar datos de formularios (para POSTs de create/edit)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sirve archivos estáticos desde la carpeta 'public'.
app.use(express.static(path.join(__dirname, 'public')));

// --- SIMULACIÓN DE BASE DE DATOS DE PRODUCTOS ---
// Estos datos se usan para el pre-rellenado del formulario de edición.
const productsData = [
    {
        id: 'pelota', // Usamos el slug como ID para este ejemplo
        slug: 'pelota',
        name: 'Balón oficial',
        description: 'Balón de voleibol oficial FIVB, ideal para entrenamientos y partidos de alto rendimiento. Material sintético de alta calidad con excelente agarre y durabilidad.',
        price: 55.00,
        imageUrl: '/img/pelota.jpg',
        category: 'balones', // Agregado para el formulario de edición
        details: 'Tamaño reglamentario, peso oficial, apto para interior y exterior.'
    },
    {
        id: 'zapatillas',
        slug: 'zapatillas',
        name: 'Zapatillas de alto rendimiento',
        description: 'Zapatillas de voleibol diseñadas para una máxima agilidad y soporte en la cancha. Ofrecen amortiguación superior y tracción multidireccional.',
        price: 55.00,
        imageUrl: '/img/zapatillas.jpg',
        category: 'zapatillas',
        details: 'Varios colores y tallas disponibles. Suela de goma antideslizante, transpirables.'
    },
    {
        id: 'rodillera',
        slug: 'rodillera',
        name: 'Rodilleras profesionales',
        description: 'Rodilleras de voleibol con acolchado de alta densidad para protección superior. Diseño ergonómico que permite total libertad de movimiento.',
        price: 55.00,
        imageUrl: '/img/rodillera.jpg',
        category: 'accesorios',
        details: 'Todos los tamaños. Tejido elástico y transpirable. Protección contra impactos.'
    },
    {
        id: 'remera',
        slug: 'remera',
        name: 'Remera de la selección Argentina',
        description: 'Camiseta técnica oficial de la selección Argentina de voleibol. Tejido ligero y transpirable para mantenerte fresco durante el juego.',
        price: 55.00,
        imageUrl: '/img/remera.jpg',
        category: 'indumentaria',
        details: 'Diseño exclusivo. Material de secado rápido. Disponible en tallas S, M, L, XL.'
    },
    {
        id: 'calza',
        slug: 'calza',
        name: 'Calza Sonder',
        description: 'Calza deportiva de voleibol marca Sonder. Ajuste cómodo y tejido elástico que permite un movimiento sin restricciones.',
        price: 40.00,
        imageUrl: '/img/calza.png',
        category: 'indumentaria',
        details: 'Talle L. Ideal para entrenamientos y partidos. Alta durabilidad.'
    },
    {
        id: 'manga',
        slug: 'manga',
        name: 'Manga Sonder',
        description: 'Mangas deportivas para voleibol marca Sonder. Proporcionan compresión y protección para los brazos durante el juego.',
        price: 10.00,
        imageUrl: '/img/manga.jpg',
        category: 'accesorios',
        details: 'Talle 1. Tejido transpirable. Ayuda a reducir la fatiga muscular.'
    }
];
// --- FIN SIMULACIÓN DE BASE DE DATOS ---


// --- Rutas Generales ---

// ruta para index (home)
app.get('/', (req, res) => {
    res.render('users/index'); 
});

// ruta para productos (general)
app.get('/productos', (req, res) => {
    res.render('users/productos'); 
});

// ruta para iniciar sesión
app.get('/sign_in', (req, res) => {
    res.render('users/sign_in');
});

// ruta para registrarse
app.get('/register', (req, res) => {
    res.render('users/register'); 
});

// ruta para el carrito de compras
app.get('/cart', (req, res) => {
    res.render('users/cart'); 
});

// rutas de Detalle de Producto Individuales 
app.get('/productos/pelota', (req, res) => {
    res.render('productos/pelota'); //pelota
});

app.get('/productos/zapatillas', (req, res) => {
    res.render('productos/zapatillas'); //zapatillas
});

app.get('/productos/remera', (req, res) => {
    res.render('productos/remera'); //remera
});

app.get('/productos/rodillera', (req, res) => {
    res.render('productos/rodillera'); //rodillera
});

app.get('/productos/calza', (req, res) => {
    res.render('productos/calza'); //calza
});

app.get('/productos/manga', (req, res) => {
    res.render('productos/manga'); //manga
});

// --- Rutas de Gestión de Productos (Crear/Editar) ---

// Ruta para servir createProduct (crear producto)
app.get('/createProduct', (req, res) => {
    res.render('users/createProduct', { pageTitle: 'Cargar Nuevo Producto' }); 
});

app.post('/createProduct', (req, res) => {
    const { productName, description, price, stock, category, imageUrl } = req.body;
    console.log('Producto recibido para crear:', { productName, description, price, stock, category, imageUrl });
    res.redirect('/productos'); // Redirige a la página de productos (general)
});

// Ruta para servir editproduct (editar producto) - DINÁMICA
app.get('/editProduct/:id', (req, res) => {
    const productId = req.params.id;
    // Busca el producto en tu array productsData por su 'id'
    const productToEdit = productsData.find(p => p.id === productId);

    if (productToEdit) {
        // Si el producto existe, renderiza el formulario de edición con sus datos
        res.render('users/editProduct', { 
            pageTitle: `Editar Producto: ${productToEdit.name}`,
            product: productToEdit 
        });
    } else {
        // Si no se encuentra el producto, muestra un error 404
        res.status(404).render('users/error', { message: 'Producto no encontrado para editar.' });
    }
});

app.post('/editProduct/:id', (req, res) => {
    const productId = req.params.id;
    const { productName, description, price, stock, category, imageUrl } = req.body;

    // Aquí iría la lógica para ACTULIZAR el producto con 'productId' en tu 'productsData' o base de datos.
    // Por ejemplo:
    let productIndex = productsData.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
        productsData[productIndex] = {
            ...productsData[productIndex], // Mantén propiedades existentes que no se editan
            name: productName,
            description,
            price: parseFloat(price),
            stock: parseInt(stock),
            category,
            imageUrl
        };
        console.log(`Producto ${productId} actualizado:`, productsData[productIndex]);
    } else {
        console.log(`Producto ${productId} no encontrado para actualizar.`);
    }

    res.redirect('/productos'); // Redirige después de "actualizar"
});

// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});