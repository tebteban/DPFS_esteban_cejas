const path = require('path');
const fs = require('fs');
const { validationResult } = require('express-validator');
const { Product, Category, Brand } = require('../../models');

const fetchFormData = async () => {
  const [categories, brands] = await Promise.all([
    Category.findAll(),
    Brand.findAll()
  ]);
  return { categories, brands };
};


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
      const { categories, brands } = await fetchFormData();
      res.render('users/createProduct', {
        pageTitle: 'Cargar Nuevo Producto',
        errors: [],
        oldData: {},
        categories,
        message: null,
        brands
      });
    } catch (error) {
      console.error('Error al cargar formulario de producto:', error);
      res.status(500).render('users/error', { message: 'Error al cargar formulario de producto.' });
    }
  },

  // 🧩 Crear producto
  postCreateProduct: async (req, res) => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
      const { categories, brands } = await fetchFormData();
      return res.status(400).render('users/createProduct', {
        pageTitle: 'Cargar Nuevo Producto',
        errors: errors.array(),
        oldData: req.body,
        categories,
        brands
      });
    }

    try {
      const imageUrl = `/img/products/${req.file.filename}`;
      await Product.create({
        name: req.body.productName,
        description: req.body.description,
        price: parseFloat(req.body.price),
        stock: parseInt(req.body.stock, 10),
        image: imageUrl,
        category_id: parseInt(req.body.category_id, 10),
        brand_id: parseInt(req.body.brand_id, 10),
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
      const { categories, brands } = await fetchFormData();
 
      if (!product)
        return res.status(404).render('users/error', { message: 'Producto no encontrado.' });

      res.render('users/editProduct', {
        pageTitle: `Editar Producto: ${product.name}`,
        product,
        categories,
        brands,
        errors: [],
        oldData: {}
      });
    } catch (error) {
      console.error(error);
      res.status(500).render('users/error', { message: 'Error al cargar producto para edición.' });
    }
  },

  // 🔄 Actualizar producto
  postEditProduct: async (req, res) => {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).render('users/error', { message: 'Producto no encontrado.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const { categories, brands } = await fetchFormData();
      return res.status(400).render('users/editProduct', {
        pageTitle: `Editar Producto: ${product.name}`,
        product,
        categories,
        brands,
        errors: errors.array(),
        oldData: req.body
      });
    }
   try{
      let imageUrl = product.image;
      if (req.file) {
        imageUrl = `/img/products/${req.file.filename}`;
        if (product.image && product.image.startsWith('/img/products/')) {
          const oldPath = path.join(__dirname, '../../public', product.image);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      }

      await product.update({
        name: req.body.productName,
        description: req.body.description,
        price: parseFloat(req.body.price),
        stock: parseInt(req.body.stock, 10),
        category_id: parseInt(req.body.category_id, 10),
        brand_id: parseInt(req.body.brand_id, 10),
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
