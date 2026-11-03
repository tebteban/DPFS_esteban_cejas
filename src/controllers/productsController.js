const path = require('path');
const fs = require('fs');
const { validationResult } = require('express-validator');
const { sequelize, Product, Category, Brand, ProductImage, ProductVariant } = require('../../models');
const { parseVariants } = require('../validations/productValidations');

// Borra una imagen subida (solo las de /img/products/, nunca otras rutas)
const removeImageFile = (url) => {
  if (!url || !url.startsWith('/img/products/')) return;
  const filePath = path.join(__dirname, '../../public', url);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

// Si el formulario falla, no dejar imágenes huérfanas en disco
const removeUploads = (req) => Object.values(req.files || {}).flat().forEach(f => fs.unlinkSync(f.path));

// Stock total: la suma de los talles, o el campo "Stock" si es talle único
const totalStock = (body, variants) => variants.length ? variants.reduce((sum, v) => sum + v.stock, 0) : parseInt(body.stock, 10);

// Deja los talles del producto iguales a los del formulario (actualiza, crea y borra)
const syncVariants = async (product, variants, transaction) => {
  const existing = await ProductVariant.findAll({ where: { product_id: product.id }, transaction });
  for (const old of existing) {
    const match = variants.find(v => v.size === old.size);
    if (match) await old.update({ stock: match.stock }, { transaction });
    else await old.destroy({ transaction });
  }
  const toCreate = variants.filter(v => !existing.some(old => old.size === v.size));
  await ProductVariant.bulkCreate(toCreate.map(v => ({ product_id: product.id, ...v })), { transaction });
};

const saveGallery = (productId, files = [], startPosition = 0, transaction) => ProductImage.bulkCreate(
  files.map((f, i) => ({ product_id: productId, url: `/img/products/${f.filename}`, position: startPosition + i })),
  { transaction }
);

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
      const { categoria, orden } = req.query;
      let where = {};
      if (categoria) where.category_id = categoria;

      let order = [];
      if (orden === 'precio_asc') order = [['price', 'ASC']];
      if (orden === 'precio_desc') order = [['price', 'DESC']];

      const products = await Product.findAll({ 
        where,
        order,
        include: ['category', 'brand', 'images', 'variants']
      });
      
      const categories = await Category.findAll();

      res.render('users/productos', {
        products,
        categories,
        currentCategory: categoria || '',
        currentOrder: orden || '',
        pageTitle: 'Catálogo Z6',
        searchTerm: ''
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
      include: ['category', 'brand', 'images', 'variants']
    });

    const categories = await Category.findAll();

    if (products.length > 0) {
      return res.render('users/productos', {
        products,
        categories,
        currentCategory: '',
        currentOrder: '',
        pageTitle: `Resultados para "${searchTerm}"`,
        searchTerm
      });
    } else {
      return res.render('users/productos', {
        products: [],
        categories,
        currentCategory: '',
        currentOrder: '',
        pageTitle: `Sin resultados para "${searchTerm}"`,
        searchTerm
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
      const product = await Product.findByPk(req.params.id, {
        include: ['category', 'brand', 'images', 'variants'],
        order: [[{ model: ProductImage, as: 'images' }, 'position', 'ASC'], [{ model: ProductVariant, as: 'variants' }, 'id', 'ASC']]
      });
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
      removeUploads(req);
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
      const variants = parseVariants(req.body);
      await sequelize.transaction(async (transaction) => {
        const product = await Product.create({
          name: req.body.productName,
          description: req.body.description,
          price: parseFloat(req.body.price),
          stock: totalStock(req.body, variants),
          image: imageUrl,
          category_id: parseInt(req.body.category_id, 10),
          brand_id: parseInt(req.body.brand_id, 10),
          user_id: req.session.userLogged ? req.session.userLogged.id : null
        }, { transaction });
        await syncVariants(product, variants, transaction);
        await saveGallery(product.id, req.files?.galleryImages, 0, transaction);
      });
      res.redirect('/admin');
    } catch (error) {
      console.error('Error al crear producto:', error);
      res.status(500).render('users/error', { message: 'Error al guardar producto.' });
    }
  },

  // ✏️ Editar producto
  getEditProduct: async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id, {
        include: ['images', 'variants'],
        order: [[{ model: ProductVariant, as: 'variants' }, 'id', 'ASC']]
      });
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
    const product = await Product.findByPk(req.params.id, { include: ['images', 'variants'] });
    if (!product) {
      removeUploads(req);
      return res.status(404).render('users/error', { message: 'Producto no encontrado.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      removeUploads(req);
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
        removeImageFile(product.image);
      }

      // Fotos de galería marcadas para borrar (solo las de este producto)
      const toRemove = [].concat(req.body.removeImages || []).map(Number);
      for (const img of product.images.filter(i => toRemove.includes(i.id))) {
        removeImageFile(img.url);
        await img.destroy();
      }
      const lastPosition = Math.max(-1, ...product.images.map(i => i.position));
      await saveGallery(product.id, req.files?.galleryImages, lastPosition + 1);

      const variants = parseVariants(req.body);
      await sequelize.transaction(async (transaction) => {
        await product.update({
          name: req.body.productName,
          description: req.body.description,
          price: parseFloat(req.body.price),
          stock: totalStock(req.body, variants),
          category_id: parseInt(req.body.category_id, 10),
          brand_id: parseInt(req.body.brand_id, 10),
          image: imageUrl
        }, { transaction });
        await syncVariants(product, variants, transaction);
      });

      res.redirect('/admin');
    } catch (error) {
      console.error(error);
      res.status(500).render('users/error', { message: 'Error al actualizar producto.' });
    }
  },

  // 🗑️ Eliminar producto
  postDeleteProduct: async (req, res) => {
    try {
      const product = await Product.findByPk(req.params.id, { include: ['images'] });
      if (!product)
        return res.status(404).render('users/error', { message: 'Producto no encontrado.' });

      removeImageFile(product.image);
      product.images.forEach(img => removeImageFile(img.url));
      await ProductImage.destroy({ where: { product_id: product.id } });
      await ProductVariant.destroy({ where: { product_id: product.id } });

      await Product.destroy({ where: { id: req.params.id } });
      res.redirect('/admin');
    } catch (error) {
      console.error(error);
      res.status(500).render('users/error', { message: 'Error al eliminar producto.' });
    }
  }
};

module.exports = productsController;
