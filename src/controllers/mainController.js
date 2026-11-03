const mainController = {
    // Lógica para la página de inicio
    getHome: (req, res) => {
        res.render('users/index');
    },

    // Lógica para la página del carrito
    getCart: (req, res) => {
        res.render('users/cart');
    },
};

module.exports = mainController;