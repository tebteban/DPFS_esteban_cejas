

const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { readProducts, writeProducts } = require('../data/models');

const productsController = {
    getProducts: (req, res) => {
        const productsData = readProducts();
        res.render('users/productos', { products: productsData, pageTitle: 'Todos los Productos' });
    },
    getSearchProduct: (req, res) => {
        const searchTerm = req.query.q;
        const productsData = readProducts();

        if (!searchTerm) {
            return res.redirect('/productos');
        }

        const normalizedSearchTerm = searchTerm.toLowerCase().trim();
        const foundProduct = productsData.find(product => product.name.toLowerCase().includes(normalizedSearchTerm));

        if (foundProduct) {
            res.redirect(`/productos/${foundProduct.slug}`);
        } else {
            res.status(404).render('users/error', {
                message: `No se encontró ningún producto que coincida con "${searchTerm}".`
            });
        }
    },
    getProductDetail: (req, res) => {
        const productSlug = req.params.slug;
        const productsData = readProducts();
        const product = productsData.find(p => p.slug === productSlug);

        if (product) {
            res.render('productos/productDetail', { product, pageTitle: product.name });
        } else {
            res.status(404).render('users/error', { message: 'Producto no encontrado.' });
        }
    },
    getCreateProduct: (req, res) => {
        res.render('users/createProduct', { pageTitle: 'Cargar Nuevo Producto', message: null, oldData: {} });
    },
    postCreateProduct: (req, res) => {
        const { productName, description, price, category, stock } = req.body;
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
            return res.status(400).render('users/createProduct', { pageTitle: 'Cargar Nuevo Producto', message: errorMessage, oldData: req.body });
        }

        const productsData = readProducts();
        const newId = uuidv4();
        let baseSlug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
        let productSlug = baseSlug;
        let counter = 1;
        while (productsData.some(p => p.slug === productSlug)) {
            productSlug = `${baseSlug}-${counter}`;
            counter++;
        }

        const imageUrl = `/img/${file.filename}`;

        const newProduct = {
            id: newId,
            slug: productSlug,
            name: productName,
            description,
            price: parseFloat(price),
            stock: parseInt(stock),
            imageUrl: imageUrl,
            category,
            details: description
        };

        productsData.push(newProduct);
        writeProducts(productsData);
        res.redirect('/productos');
    },
    getEditProduct: (req, res) => {
        const productId = req.params.id;
        const productsData = readProducts();
        const productToEdit = productsData.find(p => p.id === productId);

        if (productToEdit) {
            res.render('users/editProduct', { pageTitle: `Editar Producto: ${productToEdit.name}`, product: productToEdit, message: null });
        } else {
            res.status(404).render('users/error', { message: 'Producto no encontrado para editar.' });
        }
    },
    postEditProduct: (req, res) => {
        const productId = req.params.id;
        const productsData = readProducts();
        const productIndex = productsData.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            return res.status(404).render('users/error', { message: 'Producto no encontrado para actualizar.' });
        }

        const { productName, description, price, stock, category } = req.body;
        const file = req.file;
        const oldProduct = productsData[productIndex];

        let errorMessage = null;
        if (!productName || !description || !price || !category || stock === undefined || stock === '') {
            errorMessage = 'Todos los campos obligatorios deben ser completados.';
        } else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            errorMessage = 'El precio debe ser un número válido y mayor que cero.';
        } else if (isNaN(parseInt(stock)) || parseInt(stock) < 0) {
            errorMessage = 'El stock debe ser un número entero válido y no negativo.';
        }

        if (errorMessage) {
            return res.status(400).render('users/editProduct', { pageTitle: `Editar Producto: ${oldProduct.name}`, product: { ...oldProduct, name: productName, description, price: parseFloat(price), stock: parseInt(stock), category }, message: errorMessage });
        }

        let newImageUrl = oldProduct.imageUrl;
        if (file) {
            newImageUrl = `/img/${file.filename}`;
            if (oldProduct.imageUrl && oldProduct.imageUrl.startsWith('/img/')) {
                const oldImagePath = path.join(__dirname, 'public', oldProduct.imageUrl);
                fs.unlink(oldImagePath, (err) => {
                    if (err) console.error('Error al eliminar imagen antigua:', oldImagePath, err);
                    else console.log('Imagen antigua eliminada:', oldImagePath);
                });
            }
        }

        productsData[productIndex] = {
            ...oldProduct,
            name: productName,
            description,
            price: parseFloat(price),
            stock: parseInt(stock),
            category,
            imageUrl: newImageUrl
        };

        writeProducts(productsData);
        res.redirect('/productos');
    },
    postDeleteProduct: (req, res) => {
        const productId = req.params.id;
        let productsData = readProducts();

        const productIndex = productsData.findIndex(p => p.id === productId);
        if (productIndex === -1) {
            return res.status(404).render('users/error', { message: 'Producto no encontrado para eliminar.' });
        }

        const productToDelete = productsData[productIndex];
        if (productToDelete.imageUrl && productToDelete.imageUrl.startsWith('/img/')) {
            const imagePath = path.join(__dirname, 'public', productToDelete.imageUrl);
            fs.unlink(imagePath, (err) => {
                if (err) console.error('Error al eliminar el archivo de imagen:', imagePath, err);
                else console.log('Archivo de imagen eliminado:', imagePath);
            });
        }

        productsData = productsData.filter(p => p.id !== productId);
        writeProducts(productsData);
        res.redirect('/productos');
    },
};

module.exports = productsController;