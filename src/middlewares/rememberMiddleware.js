const { readUsers } = require('../data/models'); // Asegúrate de que esta función exista

module.exports = (req, res, next) => {
    // 1. Si el usuario ya está logeado, pasa al siguiente middleware
    if (req.session.userLogged) {
        return next();
    }

    // 2. Si no está logeado, pero tiene la cookie 'rememberUser'
    if (req.cookies && req.cookies.rememberUser) {
        const user = readUsers().find(u => u.id === req.cookies.rememberUser);

        if (user) {
            // Recrear la sesión con el objeto completo del usuario (sin password)
            const userToSession = { 
                id: user.id, 
                firstName: user.firstName, 
                lastName: user.lastName,
                email: user.email, 
                image: user.image,
                category: user.category
            };
            
            req.session.userLogged = userToSession; // <-- ¡Nombre corregido y consistente!
        } else {
            // Cookie inválida o usuario borrado, limpiarla
            res.clearCookie('rememberUser');
        }
    }
    next();
};
