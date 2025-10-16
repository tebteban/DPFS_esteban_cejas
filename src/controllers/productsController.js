const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Product, Category, Brand } = require('../../models'); // importa modelos Sequelize

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

    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    try {
      const product = await Product.findOne({
        where: { name: { [require('sequelize').Op.like]: `%${normalizedSearchTerm}%` } }
      });

      if (product) res.redirect(`/productos/${product.id}`);
      else
        res.status(404).render('users/error', {
          message: `No se encontró ningún producto que coincida con "${searchTerm}".`
        });
    } catch (error) {
      console.error(error);
      res.status(500).render('users/error', { message: 'Error al buscar producto.' });
    }
  },

  // 🧾 Detalle de producto
  getProductDetail: async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id, {
        include: ['category', 'brand']
      });
      if (!product)
        return res.status(404).render('users/error', { message: 'Producto no encontrado.' });
      res.render('productos/productDetail', {
        product,
        pageTitle: product.name
      });
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
      res.status(500).render('users/error', { message: 'Error al cargar formulario de producto.' });
    }
  },

  // 🧩 Crear producto
  postCreateProduct: async (req, res) => {
    const { productName, description, price, category, stock, brand } = req.body;
    const file = req.file;

    let errorMessage = null;
    if (!productName || !description || !price || !category || stock === undefined || stock === '') {
      errorMessage = 'Todos los campos obligatorios deben ser completados.';
    } else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      errorMessage = 'El precio debe ser un número válido mayor que cero.';
    } else if (isNaN(parseInt(stock)) || parseInt(stock) < 0) {
      errorMessage = 'El stock debe ser un número entero válido y no negativo.';
    } else if (!file) {
      errorMessage = 'Debe subir una imagen para el producto.';
    }

    if (errorMessage) {
      return res.status(400).render('users/createProduct', {
        pageTitle: 'Cargar Nuevo Producto',
        message: errorMessage,
        oldData: req.body
      });
    }

    try {
      const imageUrl = `/img/${file.filename}`;
      await Product.create({
        name: productName,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        image: imageUrl,
        category_id: category,
        brand_id: brand
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
        return res.status(404).render('users/error', { message: 'Producto no encontrado para editar.' });

      res.render('users/editProduct', {
        pageTitle: `Editar Producto: ${product.name}`,
        product,
        categories,
        brands,
        message: null
      });
    } catch (error) {
      res.status(500).render('users/error', { message: 'Error al cargar producto para edición.' });
    }
  },

  postEditProduct: async (req, res) => {
    const { productName, description, price, stock, category, brand } = req.body;
    const file = req.file;

    try {
      const product = await Product.findByPk(req.params.id);
      if (!product)
        return res.status(404).render('users/error', { message: 'Producto no encontrado.' });

      let imageUrl = product.image;
      if (file) {
        imageUrl = `/img/${file.filename}`;
        // eliminar imagen anterior si existe
        if (product.image && product.image.startsWith('/img/')) {
          const oldPath = path.join(__dirname, '../../public', product.image);
          fs.unlink(oldPath, err => {
            if (err) console.error('No se pudo eliminar la imagen anterior:', err);
          });
        }
      }

      await product.update({
        name: productName,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category_id: category,
        brand_id: brand,
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
        return res.status(404).render('users/error', { message: 'Producto no encontrado para eliminar.' });

      if (product.image && product.image.startsWith('/img/')) {
        const imgPath = path.join(__dirname, '../../public', product.image);
        fs.unlink(imgPath, err => {
          if (err) console.error('Error al eliminar imagen:', err);
        });
      }

      await Product.destroy({ where: { id: req.params.id } });
      res.redirect('/productos');
    } catch (error) {
      res.status(500).render('users/error', { message: 'Error al eliminar producto.' });
    }
  }
};

module.exports = productsController;
