const bcrypt = require('bcryptjs');
const { User } = require('../../models'); // importamos el modelo Sequelize

const usersController = {

  // 🧾 Mostrar formulario de registro
  register: (req, res) => {
    res.render('users/register');
  },

  // 💾 Guardar usuario (POST /users/register)
  store: async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    try {
      // 1️⃣ Verificar si el email ya existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).render('users/register', { 
          message: 'Este email ya está registrado.', 
          oldData: req.body 
        });
      }

      // 2️⃣ Hashear contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3️⃣ Crear usuario
      await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'customer',
        image: req.file ? `/img/users/${req.file.filename}` : '/img/users/default.jpg'
      });

      // 4️⃣ Redirigir al login con mensaje
      res.redirect('/users/login?registrationSuccess=true');
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      res.status(500).render('users/register', { 
        message: 'Error del servidor. Intenta nuevamente.', 
        oldData: req.body 
      });
    }
  },

  // 🧠 Mostrar formulario de login
  login: (req, res) => {
    res.render('users/login', { query: req.query });
  },

  // 🔑 Procesar login (POST /users/login)
  loginProcess: async (req, res) => {
    const { email, password, remember } = req.body;

    try {
      // 1️⃣ Buscar usuario
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.render('users/login', { 
          message: 'Credenciales inválidas.', 
          query: req.query 
        });
      }

      // 2️⃣ Comparar contraseñas
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.render('users/login', { 
          message: 'Credenciales inválidas.', 
          query: req.query 
        });
      }

      // 3️⃣ Crear sesión
      const userToSession = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        image: user.image,
        role: user.role
      };
      req.session.userLogged = userToSession;

      // 4️⃣ Recordarme (cookie)
      if (remember) {
        res.cookie('rememberUser', user.id, {
          maxAge: 1000 * 60 * 60 * 24 * 90, // 90 días
          httpOnly: true
        });
      }

      // 5️⃣ Redirigir al perfil
      res.redirect('/users/profile');
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).render('users/login', { 
        message: 'Error del servidor.', 
        query: req.query 
      });
    }
  },

  // 👤 Perfil de usuario
 // Perfil (GET /users/profile)
profile: async (req, res) => {
  try {
    // Buscar el usuario más reciente desde la base de datos
    const freshUser = await User.findByPk(req.session.userLogged.id);

    // Si existe, actualizamos los datos de sesión (por si el rol o la imagen cambiaron)
    if (freshUser) {
      req.session.userLogged.role = freshUser.role;
      req.session.userLogged.image = freshUser.image;
      req.session.userLogged.firstName = freshUser.firstName;
      req.session.userLogged.lastName = freshUser.lastName;
    }

    // Renderizar el perfil con los datos actualizados
    res.render('users/profile', { user: req.session.userLogged });
  } catch (error) {
    console.error('Error al actualizar sesión del usuario:', error);
    res.status(500).render('users/error', { message: 'Error al cargar el perfil.' });
  }
},


  // 🚪 Logout
  logout: (req, res) => {
    res.clearCookie('rememberUser');
    req.session.destroy(() => res.redirect('/'));
  }
};

module.exports = usersController;
