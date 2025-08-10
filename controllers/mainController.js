const mainController = {
    // Lógica para la página de inicio
    getHome: (req, res) => {
        res.render('users/index');
    },

    // Lógica para la página de login
    getSignIn: (req, res) => {
        const registrationSuccess = req.query.registrationSuccess === 'true';
        res.render('users/sign_in', { registrationSuccess });
    },

    // Lógica para la página de registro
    getRegister: (req, res) => {
        res.render('users/register', { message: null });
    },

    // Lógica para la página del carrito
    getCart: (req, res) => {
        res.render('users/cart');
    },
};

module.exports = mainController;