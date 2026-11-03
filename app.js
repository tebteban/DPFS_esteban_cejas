require('./src/utils/loadEnv')();

const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const rememberMiddleware = require('./src/middlewares/rememberMiddleware');

const app = express();
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 3000;
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${PORT}`;
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me';

// Configuración de EJS y la carpeta 'views'
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Middlewares globales (formularios y archivos estáticos)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Configuración de sesiones y cookies ---
app.use(cookieParser(SESSION_SECRET)); // firma la cookie rememberUser para que no se pueda falsificar
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 2 // 2 horas
  }
}));

// ✅ NUEVAS RUTAS API
app.use('/api/users', require('./src/routes/api/usersApiRoutes'));
app.use('/api/products', require('./src/routes/api/productsApiRoutes'));

// --- Configuración Swagger (API visual/documentación) ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Spikeshop API',
      version: '1.0.0',
      description: 'Documentación de la API de usuarios y productos de Spikeshop',
    },
    servers: [
      {
        url: APP_BASE_URL,
        description: 'Servidor configurado'
      }
    ]
  },
  apis: ['./src/routes/api/*.js'], // <-- se documentan las rutas de tu carpeta api/
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// --- Conexión a la base de datos ---
const db = require('./models');
db.sequelize.authenticate()
  .then(() => console.log('✅ Conectado correctamente a la base de datos:', db.sequelize.config.database))
  .catch(err => console.error('❌ Error de conexión:', err));

// Middleware para recordar al usuario
app.use(rememberMiddleware);

// Helpers de imagen disponibles en todas las vistas (fallback si falta la foto)
app.locals.productImg = (img) => !img || img === 'default.jpg' ? '/img/products/default.svg' : img.startsWith('/') ? img : '/img/products/' + img;
app.locals.avatarImg = (img) => !img || img.endsWith('default.jpg') ? '/img/users/default.svg' : img;

// Middleware ÚNICO para pasar el usuario a todas las vistas (res.locals.user)
app.use((req, res, next) => {
  res.locals.user = req.session.userLogged || null; 
  next();
});

// --- Configuración de Multer (productos) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'public', 'img', 'products');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  // Si el archivo no es imagen se descarta y la validación avisa al usuario
  fileFilter: (req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype))
});

// --- Rutas principales ---
const mainRoutes = require('./src/routes/mainRoutes');
const usersRoutes = require('./src/routes/usersRoutes');
const productsRoutes = require('./src/routes/productsRoutes')(upload);
const adminRoutes = require('./src/routes/adminRoutes');

app.use('/', mainRoutes);
app.use('/users', usersRoutes);
app.use('/productos', productsRoutes);
app.use('/admin', adminRoutes);

// --- 404 y manejo de errores ---
app.use((req, res) => {
  res.status(404).render('users/error', { message: 'La página que buscás no existe.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  const message = err instanceof multer.MulterError || err.message?.startsWith('Solo se permiten')
    ? 'La imagen debe ser JPG, PNG o WEBP de hasta 2MB.'
    : 'Algo salió mal. Por favor, intentá de nuevo más tarde.';
  res.status(err instanceof multer.MulterError ? 400 : 500).render('users/error', { message });
});

// --- Inicio del servidor ---
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log(`📘 Documentación API disponible en http://localhost:${PORT}/api-docs`);
});
