// app.js

const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Configura EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para procesar datos de formularios (para POSTs de create/edit)
// Asegúrate de que bodyParser (urlencoded y json) esté ANTES de Multer
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sirve archivos estáticos desde la carpeta 'public'.
app.use(express.static(path.join(__dirname, 'public')));

// --- Configuración de Multer para la subida de imágenes ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'public', 'img');
        // Asegúrate de que la carpeta exista. Si no, Multer la creará.
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath); // Directorio donde se guardarán las imágenes
    },
    filename: (req, file, cb) => {
        // Genera un nombre de archivo único para evitar colisiones
        // Mantén la extensión original del archivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname); // Obtiene la extensión
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

// Crea una instancia de Multer con la configuración de almacenamiento
// 'productImage' es el nombre del campo del input file en tu formulario
const upload = multer({ storage: storage });

// --- Gestión de Datos de Productos (Archivo JSON) ---
const productsPath = path.join(__dirname, 'data', 'products.json');

function readProducts() {
    try {
        const jsonData = fs.readFileSync(productsPath, 'utf-8');
        return JSON.parse(jsonData);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn('products.json no encontrado, inicializando con un array vacío.');
            return [];
        }
        console.error('Error al leer o parsear products.json:', error);
        return [];
    }
}

function writeProducts(products) {
    try {
        fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    } catch (error) {
        console.error('Error al escribir en products.json:', error);
    }
}

// --- Gestión de Datos de Usuarios (Archivo JSON) ---
const usersPath = path.join(__dirname, 'data', 'users.json');

function readUsers() {
    try {
        const jsonData = fs.readFileSync(usersPath, 'utf-8');
        return JSON.parse(jsonData);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn('users.json no encontrado, inicializando con un array vacío.');
            return [];
        }
        console.error('Error al leer o parsear users.json:', error);
        return [];
    }
}

function writeUsers(users) {
    try {
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error al escribir en users.json:', error);
    }
}

// --- Rutas Generales ---

app.get('/', (req, res) => {
    res.render('users/index');
});

app.get('/productos', (req, res) => {
    const productsData = readProducts();
    res.render('users/productos', { products: productsData });
});

app.get('/productos/:slug', (req, res) => {
    const productSlug = req.params.slug;
    const productsData = readProducts();
    const product = productsData.find(p => p.slug === productSlug);

    if (product) {
        res.render('productos/productDetail', {
            product,
            pageTitle: product.name
        });
    } else {
        res.status(404).render('users/error', {
            message: 'Producto no encontrado.'
        });
    }
});

app.get('/sign_in', (req, res) => {
    const registrationSuccess = req.query.registrationSuccess === 'true';
    res.render('users/sign_in', { registrationSuccess });
});

app.get('/register', (req, res) => {
    res.render('users/register', { message: null });
});

app.post('/register', (req, res) => {
    const { firstName, lastName, email, password, dob, gender } = req.body;
    const usersData = readUsers();

    let errorMessage = null;
    if (!firstName || !lastName || !email || !password) {
        errorMessage = 'Todos los campos obligatorios (Nombre, Apellido, Email, Contraseña) deben ser completados.';
    } else if (!email.includes('@') || !email.includes('.')) {
        errorMessage = 'Por favor, introduce un email válido.';
    } else if (password.length < 8) {
        errorMessage = 'La contraseña debe tener al menos 8 caracteres.';
    } else if (usersData.some(user => user.email === email)) {
        errorMessage = 'Este email ya está registrado. Por favor, inicia sesión o usa otro email.';
    }

    if (errorMessage) {
        return res.status(400).render('users/register', { message: errorMessage });
    }

    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) {
            console.error('Error al hashear la contraseña:', err);
            return res.status(500).render('users/register', { message: 'Error interno del servidor al procesar tu solicitud.' });
        }

        const newUser = {
            id: uuidv4(),
            firstName,
            lastName,
            email,
            password: hashedPassword,
            category: "cliente",
            image: "/images/users/default.jpg",
            dob: dob || null,
            gender: gender || null
        };

        usersData.push(newUser);
        writeUsers(usersData);

        res.redirect('/sign_in?registrationSuccess=true');
    });
});

app.get('/cart', (req, res) => {
    res.render('users/cart');
});

//Rutas de Gestión de Productos (Crear/Editar/Eliminar)

// Ruta para servir createProduct (crear producto)
app.get('/createProduct', (req, res) => {
    // Asegurarse de que pageTitle, message y oldData siempre se pasen, incluso si no hay error
    res.render('users/createProduct', { pageTitle: 'Cargar Nuevo Producto', message: null, oldData: {} });
});

// Ruta POST para crear producto
app.post('/createProduct', upload.single('productImage'), (req, res) => {
    // 'productImage' debe coincidir con el 'name' del input type="file" en tu formulario
    const { productName, description, price, category, stock } = req.body;
    const file = req.file; // Multer añade la información del archivo subido a req.file

    // Validación de campos
    let errorMessage = null;
    if (!productName || !description || !price || !category || stock === undefined || stock === '') {
        errorMessage = 'Todos los campos obligatorios deben ser completados.';
    } else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        errorMessage = 'El precio debe ser un número válido mayor que cero.';
    } else if (isNaN(parseInt(stock)) || parseInt(stock) < 0) {
        errorMessage = 'El stock debe ser un número entero válido y no negativo.';
    } else if (!file) { // Para un nuevo producto, la imagen es obligatoria
        errorMessage = 'Debe subir una imagen para el producto.';
    }

    if (errorMessage) {
        // Si hay un error, renderiza el formulario de nuevo con el mensaje y los datos antiguos
        return res.status(400).render('users/createProduct', {
            pageTitle: 'Cargar Nuevo Producto',
            message: errorMessage,
            oldData: req.body // Pasa los datos que el usuario ya ingresó
        });
    }

    const productsData = readProducts();

    // Generar un ID único y un slug único para el producto
    const newId = uuidv4();
    let baseSlug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
    let productSlug = baseSlug;
    let counter = 1;
    while (productsData.some(p => p.slug === productSlug)) {
        productSlug = `${baseSlug}-${counter}`;
        counter++;
    }

    // La URL de la imagen será la ruta relativa desde 'public'
    const imageUrl = `/img/${file.filename}`;

    const newProduct = {
        id: newId,
        slug: productSlug,
        name: productName,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        imageUrl: imageUrl,
        category,
        details: description // Asumimos que la descripción es el detalle inicial
    };

    productsData.push(newProduct);
    writeProducts(productsData);

    res.redirect('/productos'); // Redirige a la lista de productos
});


// Ruta GET para servir editProduct (editar producto)
app.get('/editProduct/:id', (req, res) => {
    const productId = req.params.id;
    const productsData = readProducts();
    const productToEdit = productsData.find(p => p.id === productId);

    if (productToEdit) {
        // Si el producto existe, renderiza el formulario de edición con sus datos
        res.render('users/editProduct', {
            pageTitle: `Editar Producto: ${productToEdit.name}`,
            product: productToEdit, // Pasa el objeto completo del producto
            message: null // Inicializa el mensaje como nulo
        });
    } else {
        // Si no se encuentra el producto, muestra un error 404
        res.status(404).render('users/error', { message: 'Producto no encontrado para editar.' });
    }
});

// Ruta POST para actualizar un producto
// Usamos upload.single('productImage') para permitir cambiar la imagen
app.post('/editProduct/:id', upload.single('productImage'), (req, res) => {
    const productId = req.params.id;
    const productsData = readProducts();
    const productIndex = productsData.findIndex(p => p.id === productId);

    // Verificar si el producto existe
    if (productIndex === -1) {
        return res.status(404).render('users/error', { message: 'Producto no encontrado para actualizar.' });
    }

    const { productName, description, price, stock, category } = req.body;
    const file = req.file; // Archivo subido (si hay uno nuevo)
    const oldProduct = productsData[productIndex]; // Datos del producto actual antes de la actualización

    // Validaciones de campos
    let errorMessage = null;
    if (!productName || !description || !price || !category || stock === undefined || stock === '') {
        errorMessage = 'Todos los campos obligatorios deben ser completados.';
    } else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        errorMessage = 'El precio debe ser un número válido y mayor que cero.';
    } else if (isNaN(parseInt(stock)) || parseInt(stock) < 0) {
        errorMessage = 'El stock debe ser un número entero válido y no negativo.';
    }

    if (errorMessage) {
        // Si hay un error, renderiza de nuevo el formulario de edición con el mensaje
        // y los datos enviados para que el usuario no los pierda.
        return res.status(400).render('users/editProduct', {
            pageTitle: `Editar Producto: ${oldProduct.name}`,
            product: { // Reconstruir el objeto product con los datos enviados para que el formulario los retenga
                ...oldProduct, // Mantiene id, slug, etc.
                name: productName,
                description,
                price: parseFloat(price),
                stock: parseInt(stock),
                category
            },
            message: errorMessage
        });
    }

    let newImageUrl = oldProduct.imageUrl; // Por defecto, mantiene la imagen actual

    // Si se subió un nuevo archivo, actualizar la imageUrl
    if (file) {
        newImageUrl = `/img/${file.filename}`;
        // Opcional: Eliminar la imagen antigua si ya no se usa para liberar espacio
        // ¡CUIDADO! Asegúrate de que `oldProduct.imageUrl` sea una ruta relativa y no una URL externa
        if (oldProduct.imageUrl && oldProduct.imageUrl.startsWith('/img/')) {
            const oldImagePath = path.join(__dirname, 'public', oldProduct.imageUrl);
            fs.unlink(oldImagePath, (err) => {
                if (err) {
                    console.error('Error al eliminar imagen antigua:', oldImagePath, err);
                } else {
                    console.log('Imagen antigua eliminada:', oldImagePath);
                }
            });
        }
    }

    // Actualizar el producto en el array de productos
    productsData[productIndex] = {
        ...oldProduct, // Mantiene propiedades existentes como id, slug, etc.
        name: productName,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        imageUrl: newImageUrl // Usa la nueva URL o la antigua
    };

    // Guardar los cambios en el archivo JSON
    writeProducts(productsData);

    // Redirigir a la lista de productos o al detalle del producto actualizado
    res.redirect('/productos');
});

// ** RUTA POST PARA ELIMINAR EL PRODUCTO **
// Esta es la ruta que recibe la solicitud del modal de confirmación.
app.post('/deleteProduct/:id', (req, res) => {
    const productId = req.params.id;
    let productsData = readProducts(); // Usamos 'let' porque vamos a reasignar

    const productIndex = productsData.findIndex(p => p.id === productId);

    if (productIndex === -1) {
        console.warn(`Intento de eliminar producto con ID ${productId} que no existe.`);
        return res.status(404).render('users/error', { message: 'Producto no encontrado para eliminar.' });
    }

    const productToDelete = productsData[productIndex];

    // Opcional: Eliminar el archivo de imagen del servidor
    // Es una buena práctica para mantener tu carpeta 'public/img' limpia
    if (productToDelete.imageUrl && productToDelete.imageUrl.startsWith('/img/')) {
        const imagePath = path.join(__dirname, 'public', productToDelete.imageUrl);
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error('Error al eliminar el archivo de imagen:', imagePath, err);
            } else {
                console.log('Archivo de imagen eliminado:', imagePath);
            }
        });
    }

    // Filtra el array para eliminar el producto
    productsData = productsData.filter(p => p.id !== productId);

    // Guarda el array actualizado de productos
    writeProducts(productsData);

    // Redirige a la lista de productos después de la eliminación exitosa
    res.redirect('/productos');
});


// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});