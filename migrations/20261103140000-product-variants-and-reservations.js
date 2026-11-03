'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Stock por talle: una fila por producto + talle
    await queryInterface.createTable('product_variants', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      product_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Products', key: 'id' }, onDelete: 'CASCADE' },
      size: { type: Sequelize.STRING, allowNull: false },
      stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 }
    });
    await queryInterface.addIndex('product_variants', ['product_id', 'size'], { unique: true });

    // Pasa los talles viejos ("S,M,L") a variantes repartiendo el stock parejo (el resto va a los últimos talles)
    const [products] = await queryInterface.sequelize.query("SELECT id, sizes, stock FROM products WHERE sizes IS NOT NULL AND sizes != ''");
    for (const p of products) {
      const sizes = p.sizes.split(',').map(s => s.trim()).filter(Boolean);
      const base = Math.floor(p.stock / sizes.length);
      const extra = p.stock % sizes.length;
      await queryInterface.bulkInsert('product_variants', sizes.map((size, i) => ({
        product_id: p.id, size, stock: base + (i >= sizes.length - extra ? 1 : 0)
      })));
    }
    // La columna products.sizes queda sin uso a propósito: en SQLite borrar una columna recrea la tabla,
    // y eso dispara los ON DELETE CASCADE (borraría variantes y fotos, y desvincularía los pedidos)

    // Reserva de stock: el pedido aparta las unidades al ir a pagar y las libera si el pago no se completa
    await queryInterface.addColumn('orders', 'stock_reserved', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await queryInterface.addColumn('orders', 'expires_at', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('order_items', 'variant_id', { type: Sequelize.INTEGER, allowNull: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('order_items', 'variant_id');
    await queryInterface.removeColumn('orders', 'expires_at');
    await queryInterface.removeColumn('orders', 'stock_reserved');
    const [variants] = await queryInterface.sequelize.query('SELECT product_id, size FROM product_variants ORDER BY id');
    const byProduct = {};
    variants.forEach(v => { (byProduct[v.product_id] = byProduct[v.product_id] || []).push(v.size); });
    for (const [id, sizes] of Object.entries(byProduct)) {
      await queryInterface.sequelize.query('UPDATE products SET sizes = ? WHERE id = ?', { replacements: [sizes.join(','), id] });
    }
    await queryInterface.dropTable('product_variants');
  }
};
