'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.Order, { as: 'order', foreignKey: 'order_id' });
      OrderItem.belongsTo(models.Product, { as: 'product', foreignKey: 'product_id' });
    }
  }

  OrderItem.init(
    {
      order_id: { type: DataTypes.INTEGER, allowNull: false },
      product_id: { type: DataTypes.INTEGER, allowNull: true },
      // Nombre y precio copiados al momento de la compra: si el producto cambia o se borra, el pedido no
      name: { type: DataTypes.STRING, allowNull: false },
      unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      size: { type: DataTypes.STRING, allowNull: true },
      variant_id: { type: DataTypes.INTEGER, allowNull: true }
    },
    {
      sequelize,
      modelName: 'OrderItem',
      tableName: 'order_items',
      timestamps: false
    }
  );

  return OrderItem;
};
