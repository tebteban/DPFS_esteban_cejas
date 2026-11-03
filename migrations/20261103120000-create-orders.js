'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      user_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL' },
      email: { type: Sequelize.STRING, allowNull: true },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'pending' },
      total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      payment_id: { type: Sequelize.STRING, allowNull: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.createTable('order_items', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      order_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'orders', key: 'id' }, onDelete: 'CASCADE' },
      product_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Products', key: 'id' }, onDelete: 'SET NULL' },
      name: { type: Sequelize.STRING, allowNull: false },
      unit_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('order_items');
    await queryInterface.dropTable('orders');
  }
};
