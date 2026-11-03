// Servidor para las pruebas e2e: app real + base descartable + Mercado Pago simulado. Lo levanta Playwright solo.
const bcrypt = require('bcryptjs');
const { startApp } = require('../helpers');

// Credenciales de prueba (solo existen en la base descartable de las e2e)
const ADMIN = { email: 'admin-e2e@zona6.test', password: 'AdminE2e123' };

(async () => {
  const { db } = await startApp({ port: Number(process.env.E2E_PORT || 4600) });
  await db.User.create({ firstName: 'Admin', lastName: 'E2E', email: ADMIN.email, password: bcrypt.hashSync(ADMIN.password, 10), role: 'admin' });
  // Remera con talles: S con poco stock, M agotado, L disponible
  await db.ProductVariant.bulkCreate([
    { product_id: 1, size: 'S', stock: 2 },
    { product_id: 1, size: 'M', stock: 0 },
    { product_id: 1, size: 'L', stock: 5 }
  ]);
  await db.Product.update({ stock: 7, image: '/img/products/nike-camiseta.jpg' }, { where: { id: 1 } });
  await db.ProductImage.create({ product_id: 1, url: '/img/products/manga.jpg', position: 0 });
})();

module.exports = { ADMIN };
