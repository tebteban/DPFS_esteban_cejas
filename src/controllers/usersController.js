const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { User } = require('../../models'); // importamos el modelo Sequelize

const usersController = {

  // 🧾 Mostrar formulario de registro
  register: (req, res) => {
    res.render('users/register', { errors: [], oldData: {} });
    },

  // 💾 Guardar usuario (POST /users/register)
  store: async (req, res) => {
    const errors = validationResult(req);
    const oldData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email
    };

    if (!errors.isEmpty()) {
      return res.status(400).render('users/register', {
        errors: errors.array(),
        oldData
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      
      await User.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: hashedPassword,
        role: 'customer',
        image: req.file ? `/img/users/${req.file.filename}` : '/img/users/default.jpg'
      });


      res.redirect('/users/login?registrationSuccess=true');
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      res.status(500).render('users/register', {
        errors: [{ msg: 'Error del servidor. Intenta nuevamente.' }],
        oldData
      });
    }
  },

  // 🧠 Mostrar formulario de login
  login: (req, res) => {
    res.render('users/login', { query: req.query, errors: [], oldData: {} });
    },

  // 🔑 Procesar login (POST /users/login)
  loginProcess: async (req, res) => {
    const errors = validationResult(req);
    const oldData = { email: req.body.email };

    if (!errors.isEmpty()) {
      return res.status(400).render('users/login', {
        errors: errors.array(),
        oldData,
        query: req.query
      });
    }

    try {
      const user = await User.findOne({ where: { email: req.body.email } });
      if (!user) {
        return res.status(400).render('users/login', {
          errors: [{ msg: 'Credenciales inválidas.' }],
          oldData,
          query: req.query
        });
      }

      const passwordMatch = await bcrypt.compare(req.body.password, user.password);
      if (!passwordMatch) {
        return res.status(400).render('users/login', {
          errors: [{ msg: 'Credenciales inválidas.' }],
          oldData,
          query: req.query
        });
      }

      req.session.userLogged = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        image: user.image,
        role: user.role
      };

      if (req.body.remember === 'on') {
        res.cookie('rememberUser', user.id, {
          maxAge: 1000 * 60 * 60 * 24 * 90,
          httpOnly: true,
          sameSite: 'lax',
          secure: (process.env.NODE_ENV || 'development') === 'production'
        });
      }

      // 5️⃣ Redirigir al perfil
      res.redirect('/users/profile');
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).render('users/login', {
        errors: [{ msg: 'Error del servidor.' }],
        oldData,
        query: req.query 
      });
    }
  },

  // 👤 Perfil de usuario
   profile: async (req, res) => {
    if (!req.session.userLogged) {
      return res.redirect('/users/login');
    }

    try {
      const freshUser = await User.findByPk(req.session.userLogged.id);

      if (freshUser) {
        req.session.userLogged = {
          id: freshUser.id,
          firstName: freshUser.firstName,
          lastName: freshUser.lastName,
          email: freshUser.email,
          image: freshUser.image,
          role: freshUser.role
        };
      }

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
