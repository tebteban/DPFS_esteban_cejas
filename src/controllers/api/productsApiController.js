const { Product, Category, Brand } = require('../../../models');
const baseUrl = 'http://localhost:3000';

module.exports = {
  // GET /api/products
  list: async (req, res) => {
    try {
      const products = await Product.findAll({
        include: ['category', 'brand']
      });

      const countByCategory = {};
      products.forEach(p => {
        const cat = p.category ? p.category.name : 'Sin categoría';
        countByCategory[cat] = (countByCategory[cat] || 0) + 1;
      });

      res.json({
        count: products.length,
        countByCategory,
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description?.slice(0, 120),
          category: p.category ? p.category.name : null,
          brand: p.brand ? p.brand.name : null,
          detail: `${baseUrl}/api/products/${p.id}`
        }))
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al listar productos', detail: error.message });
    }
  },

  // GET /api/products/:id
  detail: async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id, {
        include: ['category', 'brand']
      });
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

      res.json({
        id: product.id,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        stock: product.stock,
        category: product.category ? product.category.name : null,
        brand: product.brand ? product.brand.name : null,
        image_url: `${baseUrl}${product.image}`,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener producto', detail: error.message });
    }
  }
};
