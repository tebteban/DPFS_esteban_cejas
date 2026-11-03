const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { User, Order } = require('../../models'); // importamos los modelos Sequelize

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
        image: req.file ? `/img/users/${req.file.filename}` : null
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
          signed: true,
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

      const orders = await Order.findAll({
        where: { user_id: req.session.userLogged.id, status: { [Op.notIn]: ['cancelled', 'expired'] } },
        include: ['items'],
        order: [['createdAt', 'DESC']]
      });

      res.render('users/profile', { user: req.session.userLogged, orders });
    } catch (error) {
      console.error('Error al actualizar sesión del usuario:', error);
      res.status(500).render('users/error', { message: 'Error al cargar el perfil.' });
    }
  },


  // ✏️ Formulario de edición de perfil
  editProfile: (req, res) => {
    res.render('users/editProfile', { errors: [], oldData: req.session.userLogged });
  },

  // 💾 Guardar perfil (nombre, foto y opcionalmente contraseña)
  updateProfile: async (req, res) => {
    const errors = validationResult(req).array();
    const user = await User.findByPk(req.session.userLogged.id);

    if (errors.length === 0 && req.body.newPassword && !(await bcrypt.compare(req.body.currentPassword, user.password))) {
      errors.push({ msg: 'La contraseña actual no es correcta.' });
    }
    if (errors.length) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).render('users/editProfile', { errors, oldData: { ...req.session.userLogged, ...req.body } });
    }

    const changes = { firstName: req.body.firstName, lastName: req.body.lastName };
    if (req.file) {
      changes.image = `/img/users/${req.file.filename}`;
      // Borra la foto anterior (solo las subidas por usuarios)
      if (user.image && user.image.startsWith('/img/users/')) {
        const oldPath = path.join(__dirname, '../../public', user.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }
    if (req.body.newPassword) changes.password = await bcrypt.hash(req.body.newPassword, 10);
    await user.update(changes);

    req.session.userLogged = { ...req.session.userLogged, firstName: user.firstName, lastName: user.lastName, image: user.image };
    res.redirect('/users/profile');
  },

  // 🚪 Logout
  logout: (req, res) => {
    res.clearCookie('rememberUser');
    req.session.destroy(() => res.redirect('/'));
  }
};

module.exports = usersController;
