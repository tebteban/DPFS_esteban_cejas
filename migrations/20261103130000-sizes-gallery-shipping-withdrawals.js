'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Talles disponibles, separados por coma (ej: "S,M,L,XL"); vacío = talle único
    await queryInterface.addColumn('products', 'sizes', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('order_items', 'size', { type: Sequelize.STRING, allowNull: true });

    // Fotos extra de cada producto (la principal sigue en products.image)
    await queryInterface.createTable('product_images', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      product_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Products', key: 'id' }, onDelete: 'CASCADE' },
      url: { type: Sequelize.STRING, allowNull: false },
      position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 }
    });

    // Datos de envío del pedido
    for (const column of ['shipping_name', 'shipping_phone', 'shipping_address', 'shipping_city', 'shipping_province', 'shipping_zip']) {
      await queryInterface.addColumn('orders', column, { type: Sequelize.STRING, allowNull: true });
    }
    await queryInterface.addColumn('orders', 'shipping_notes', { type: Sequelize.TEXT, allowNull: true });

    // Botón de arrepentimiento (Res. 424/2020)
    await queryInterface.createTable('withdrawal_requests', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      code: { type: Sequelize.STRING, allowNull: false, unique: true },
      order_id: { type: Sequelize.INTEGER, allowNull: true },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false },
      reason: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'pending' },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('withdrawal_requests');
    for (const column of ['shipping_name', 'shipping_phone', 'shipping_address', 'shipping_city', 'shipping_province', 'shipping_zip', 'shipping_notes']) {
      await queryInterface.removeColumn('orders', column);
    }
    await queryInterface.dropTable('product_images');
    await queryInterface.removeColumn('order_items', 'size');
    // products.sizes no se borra: en SQLite recrear la tabla dispararía los ON DELETE CASCADE
  }
};
