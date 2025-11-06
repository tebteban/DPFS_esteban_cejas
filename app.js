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
        url: 'http://localhost:3000',
        description: 'Servidor local de desarrollo'
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
const upload = multer({ storage: storage });

// --- Rutas principales ---
const mainRoutes = require('./src/routes/mainRoutes');
const usersRoutes = require('./src/routes/usersRoutes');
const productsRoutes = require('./src/routes/productsRoutes')(upload);

app.use('/', mainRoutes);
app.use('/users', usersRoutes);
app.use('/productos', productsRoutes);

// --- Inicio del servidor ---
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log(`📘 Documentación API disponible en http://localhost:${PORT}/api-docs`);
});
