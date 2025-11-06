const path = require('path');
const fs = require('fs');
const { Product, Category, Brand } = require('../../models');

const productsController = {

  // 📄 Listar todos los productos
  getProducts: async (req, res) => {
    try {
      const products = await Product.findAll({ include: ['category', 'brand'] });
      res.render('users/productos', {
        products,
        pageTitle: 'Todos los Productos'
      });
    } catch (error) {
      console.error('Error al listar productos:', error);
      res.status(500).render('users/error', { message: 'Error al obtener los productos.' });
    }
  },

  // 🔍 Buscar producto por nombre
 getSearchProduct: async (req, res) => {
  const searchTerm = req.query.q;
  if (!searchTerm) return res.redirect('/productos');

  try {
    const { Op } = require('sequelize');
    const products = await Product.findAll({
      where: { name: { [Op.like]: `%${searchTerm.trim()}%` } },
      include: ['category', 'brand']
    });

    if (products.length > 0) {
      return res.render('users/productos', {
        products,
        pageTitle: `Resultados de búsqueda: "${searchTerm}"`
      });
    } else {
      return res.render('users/productos', {
        products: [],
        pageTitle: `No se encontraron resultados para "${searchTerm}"`
      });
    }
  } catch (error) {
    console.error('Error en la búsqueda:', error);
    res.status(500).render('users/error', { message: 'Error al buscar productos.' });
  }
},


  // 🧾 Detalle de producto
  getProductDetail: async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id, { include: ['category', 'brand'] });
      if (!product)
        return res.status(404).render('users/error', { message: 'Producto no encontrado.' });
      res.render('productos/productDetail', { product, pageTitle: product.name });
    } catch (error) {
      res.status(500).render('users/error', { message: 'Error al obtener detalle del producto.' });
    }
  },

  // ➕ Formulario crear producto
  getCreateProduct: async (req, res) => {
    try {
      const categories = await Category.findAll();
      const brands = await Brand.findAll();
      res.render('users/createProduct', {
        pageTitle: 'Cargar Nuevo Producto',
        message: null,
        oldData: {},
        categories,
        brands
      });
    } catch (error) {
      console.error('Error al cargar formulario de producto:', error);
      res.status(500).render('users/error', { message: 'Error al cargar formulario de producto.' });
    }
  },

  // 🧩 Crear producto
  postCreateProduct: async (req, res) => {
    const { productName, description, price, stock, category_id, brand_id } = req.body;
    const file = req.file;

    let errorMessage = null;
    if (!productName || !description || !price || !category_id || !brand_id || stock === '') {
      errorMessage = 'Todos los campos obligatorios deben ser completados.';
    } else if (isNaN(price) || price <= 0) {
      errorMessage = 'El precio debe ser un número válido mayor que cero.';
    } else if (isNaN(stock) || stock < 0) {
      errorMessage = 'El stock debe ser un número válido y no negativo.';
    } else if (!file) {
      errorMessage = 'Debe subir una imagen para el producto.';
    }

    if (errorMessage) {
      const categories = await Category.findAll();
      const brands = await Brand.findAll();
      return res.status(400).render('users/createProduct', {
        pageTitle: 'Cargar Nuevo Producto',
        message: errorMessage,
        oldData: req.body,
        categories,
        brands
      });
    }

    try {
      const imageUrl = `/img/products/${file.filename}`;
      await Product.create({
        name: productName,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        image: imageUrl,
        category_id: parseInt(category_id),
        brand_id: parseInt(brand_id),
        user_id: req.session.userLogged ? req.session.userLogged.id : null
      });
      res.redirect('/productos');
    } catch (error) {
      console.error('Error al crear producto:', error);
      res.status(500).render('users/error', { message: 'Error al guardar producto.' });
    }
  },

  // ✏️ Editar producto
  getEditProduct: async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id);
      const categories = await Category.findAll();
      const brands = await Brand.findAll();

      if (!product)
        return res.status(404).render('users/error', { message: 'Producto no encontrado.' });

      res.render('users/editProduct', {
        pageTitle: `Editar Producto: ${product.name}`,
        product,
        categories,
        brands,
        message: null
      });
    } catch (error) {
      console.error(error);
      res.status(500).render('users/error', { message: 'Error al cargar producto para edición.' });
    }
  },

  // 🔄 Actualizar producto
  postEditProduct: async (req, res) => {
    const { productName, description, price, stock, category_id, brand_id } = req.body;
    const file = req.file;

    try {
      const product = await Product.findByPk(req.params.id);
      if (!product)
        return res.status(404).render('users/error', { message: 'Producto no encontrado.' });

      let imageUrl = product.image;
      if (file) {
        imageUrl = `/img/products/${file.filename}`;
        const oldPath = path.join(__dirname, '../../public', product.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      await product.update({
        name: productName,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category_id: parseInt(category_id),
        brand_id: parseInt(brand_id),
        image: imageUrl
      });

      res.redirect('/productos');
    } catch (error) {
      console.error(error);
      res.status(500).render('users/error', { message: 'Error al actualizar producto.' });
    }
  },

  // 🗑️ Eliminar producto
  postDeleteProduct: async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product)
        return res.status(404).render('users/error', { message: 'Producto no encontrado.' });

      if (product.image && product.image.startsWith('/img/products/')) {
        const imgPath = path.join(__dirname, '../../public', product.image);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }

      await Product.destroy({ where: { id: req.params.id } });
      res.redirect('/productos');
    } catch (error) {
      console.error(error);
      res.status(500).render('users/error', { message: 'Error al eliminar producto.' });
    }
  }
};

module.exports = productsController;
