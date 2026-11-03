const db = require('../../models');
const bcrypt = require('bcryptjs');

const adminController = {
    getLogin: (req, res) => {
        if (req.session.userLogged && req.session.userLogged.role === 'admin') {
            return res.redirect('/admin');
        }
        res.render('admin/login', { errors: null });
    },
    
    postLogin: async (req, res) => {
        try {
            const { username, password } = req.body;
            
            const { Op } = require('sequelize');
            // Igualdad exacta: con LIKE un "%" coincidía con cualquier usuario
            const userToLogin = await db.User.findOne({
                where: { [Op.or]: [{ email: username }, { firstName: username }] }
            });

            if (userToLogin && userToLogin.role === 'admin') {
                const isOk = bcrypt.compareSync(password, userToLogin.password);
                if (isOk) {
                    req.session.userLogged = {
                        id: userToLogin.id,
                        firstName: userToLogin.firstName,
                        lastName: userToLogin.lastName,
                        email: userToLogin.email,
                        image: userToLogin.image,
                        role: userToLogin.role
                    };
                    return res.redirect('/admin');
                }
            }

            return res.render('admin/login', {
                errors: [{ msg: 'Credenciales inválidas o no tienes permisos de administrador.' }]
            });
        } catch (error) {
            console.error(error);
            res.send('Error en login admin');
        }
    },

    getDashboard: async (req, res) => {
        try {
            const [products, orders, withdrawals] = await Promise.all([
                db.Product.findAll({ include: ['category', 'brand', 'variants'], order: [['id', 'ASC'], [{ model: db.ProductVariant, as: 'variants' }, 'id', 'ASC']] }),
                // shortcut: muestra los últimos 50; agregar paginación cuando haya muchos pedidos
                db.Order.findAll({ include: ['items', 'user'], order: [['createdAt', 'DESC']], limit: 50 }),
                db.WithdrawalRequest.findAll({ order: [['createdAt', 'DESC']], limit: 50 })
            ]);
            res.render('admin/dashboard', { products, orders, withdrawals });
        } catch (error) {
            console.error(error);
            res.send('Error cargando el dashboard');
        }
    },

    logout: (req, res) => {
        res.clearCookie('rememberUser');
        req.session.destroy(() => res.redirect('/admin/login'));
    }
};

module.exports = adminController;
