const { User } = require('../../models');

module.exports = async (req, res, next) => {
  if (req.session.userLogged) {
    return next();
  }

  const rememberCookie = req.cookies?.rememberUser;
  const userId = Number(rememberCookie);

  if (!rememberCookie || Number.isNaN(userId)) {
    if (rememberCookie) {
      res.clearCookie('rememberUser');
    }
    return next();
  }

  try {
    const user = await User.findByPk(userId);

    if (user) {
      req.session.userLogged = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        image: user.image,
        role: user.role
      };
    } else {
      res.clearCookie('rememberUser');
    }
  } catch (error) {
    console.error('Error recreando sesión desde cookie rememberUser:', error);
    res.clearCookie('rememberUser');
  }

  next();
};