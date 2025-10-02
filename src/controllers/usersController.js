const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
// Asegúrate de que esta ruta sea correcta y que readUsers/writeUsers existan
const { readUsers, writeUsers } = require('../data/models'); 

const usersController = {
    // Mostrar formulario de registro (GET /users/register)
    register: (req, res) => {
        res.render('users/register');
    },

    // Guardar usuario (POST /users/register)
    store: (req, res) => {
        const { firstName, lastName, email, password } = req.body; // Campos simplificados para el ejemplo
        const usersData = readUsers();

        // Validación básica
        if (usersData.some(user => user.email === email)) {
            return res.status(400).render('users/register', { message: 'Este email ya está registrado.', oldData: req.body });
        }

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                return res.status(500).render('users/register', { message: 'Error del servidor.' });
            }

            const newUser = {
                id: uuidv4(),
                firstName,
                lastName,
                email,
                password: hashedPassword,
                category: "cliente",
                image: req.file ? `/img/users/${req.file.filename}` : "/img/users/default.jpg",
            };

            usersData.push(newUser);
            writeUsers(usersData);

            res.redirect('/users/login?registrationSuccess=true'); 
        });
    },

    // Mostrar formulario login (GET /users/login)
    login: (req, res) => {
        res.render('users/login', { query: req.query }); 
    },

    // Procesar login (POST /users/login)
    loginProcess: (req, res) => {
        const { email, password, remember } = req.body; // <-- Captura 'remember'
        const usersData = readUsers();
        
        // 1. Buscar usuario
        const user = usersData.find(u => u.email === email);

        if (!user) {
            // Mensaje genérico por seguridad
            return res.render('users/login', { message: 'Credenciales inválidas.', query: req.query });
        }

        // 2. Comparar contraseña
        if (!bcrypt.compareSync(password, user.password)) {
            // Mensaje genérico por seguridad
            return res.render('users/login', { message: 'Credenciales inválidas.', query: req.query });
        }

        // 3. Autenticación exitosa: Crear objeto de sesión (solo datos necesarios)
        const userToSession = { 
            id: user.id, 
            firstName: user.firstName, 
            lastName: user.lastName,
            email: user.email, 
            image: user.image,
            category: user.category // Necesario para el header si lo usas
        };
        req.session.userLogged = userToSession; // <-- Nombre de la sesión consistente

        // 4. (Opcional) Configurar cookie de "Recuérdame"
        if (remember) {
            // La cookie 'rememberUser' se guarda con el ID del usuario
            res.cookie('rememberUser', user.id, { 
                maxAge: 1000 * 60 * 60 * 24 * 90, // 90 días
                httpOnly: true 
            }); 
        }
        
        // 5. Redireccionar al perfil
        res.redirect('/users/profile'); 
    },

    // Perfil (GET /users/profile)
    profile: (req, res) => {
        // La variable 'user' ya está disponible globalmente, pero se pasa de forma explícita por claridad
        res.render('users/profile', { user: req.session.userLogged });
    },

    // Logout (GET /users/logout)
    logout: (req, res) => {
        // Borrar cookie 'rememberUser' del navegador
        res.clearCookie('rememberUser'); 

        // Destruir sesión en el servidor
        req.session.destroy(() => {
            res.redirect('/');
        });
    }
};

module.exports = usersController;