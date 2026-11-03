module.exports = (req, res, next) => {
    if (req.session.userLogged && req.session.userLogged.role === 'admin') {
        return next();
    }
    return res.redirect('/admin/login');
};
