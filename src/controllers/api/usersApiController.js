const { User } = require('../../../models');
const baseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

module.exports = {
  // GET /api/users
  list: async (req, res) => {
    try {
      const users = await User.findAll();
      res.json({
        count: users.length,
        users: users.map(u => ({
          id: u.id,
          name: [u.firstName, u.lastName].filter(Boolean).join(' ').trim(), 
          email: u.email,
          detail: `${baseUrl}/api/users/${u.id}`
        }))
      });
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor', detail: error.message });
    }
  },

  // GET /api/users/:id
  detail: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      res.json({
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        role: user.role,
        image_url: `${baseUrl}${user.image}`
      });
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor', detail: error.message });
    }
  }
};
