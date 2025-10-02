const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const rememberMiddleware = require('./src/middlewares/rememberMiddleware');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de EJS y la carpeta 'views'
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Middlewares globales (formularios y archivos estáticos)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Configuración de sesiones y cookies ---
app.use(cookieParser());
app.use(session({
    secret: 'un-secreto-bien-dificil',
    resave: false,
    saveUninitialized: false
}));

// Middleware para recordar al usuario
app.use(rememberMiddleware);

// Middleware ÚNICO para pasar el usuario a todas las vistas (res.locals.user)
app.use((req, res, next) => {
    // Pasa la sesión correcta ('userLogged') a la variable global 'user'
    res.locals.user = req.session.userLogged || null; 
    next();
});

// --- Configuración de Multer (productos) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'public', 'img');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});
const upload = multer({ storage: storage });

// --- Rutas ---
const mainRoutes = require('./src/routes/mainRoutes');
const usersRoutes = require('./src/routes/usersRoutes');
const productsRoutes = require('./src/routes/productsRoutes')(upload);

app.use('/', mainRoutes);
app.use('/users', usersRoutes);
app.use('/productos', productsRoutes);

// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});