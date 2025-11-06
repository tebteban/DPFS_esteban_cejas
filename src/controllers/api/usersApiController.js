const { User } = require('../../../models');
const baseUrl = 'http://localhost:3000';

module.exports = {
  // GET /api/users
  list: async (req, res) => {
    try {
      const users = await User.findAll();
      res.json({
        count: users.length,
        users: users.map(u => ({
          id: u.id,
          name: `${u.firstName || u.first_name} ${u.lastName || u.last_name}`,
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
        first_name: user.firstName || user.first_name,
        last_name: user.lastName || user.last_name,
        email: user.email,
        role: user.role,
        image_url: `${baseUrl}${user.image}`
      });
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor', detail: error.message });
    }
  }
};
