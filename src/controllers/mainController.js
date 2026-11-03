const { Product, Category } = require('../../models');

const mainController = {
    // Lógica para la página de inicio: destacados y una tarjeta por categoría
    getHome: async (req, res) => {
        const [featured, categories] = await Promise.all([
            Product.findAll({ include: ['category', 'images', 'variants'], order: [['createdAt', 'DESC']], limit: 8 }),
            Category.findAll({ include: [{ association: 'products', attributes: ['image'] }] })
        ]);
        res.render('users/index', { featured, categories });
    },

    // Lógica para la página del carrito
    getCart: (req, res) => {
        res.render('users/cart');
    },
};

module.exports = mainController;
