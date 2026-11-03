'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      // 🔹 Un pedido tiene muchos ítems y puede pertenecer a un usuario (o ser de un invitado)
      Order.hasMany(models.OrderItem, { as: 'items', foreignKey: 'order_id' });
      Order.belongsTo(models.User, { as: 'user', foreignKey: 'user_id' });
    }
  }

  Order.init(
    {
      user_id: { type: DataTypes.INTEGER, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true },
      // Estado del pago según Mercado Pago (pending, approved, rejected...) o "review" si el monto no coincide
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
      total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      payment_id: { type: DataTypes.STRING, allowNull: true },
      shipping_name: DataTypes.STRING,
      shipping_phone: DataTypes.STRING,
      shipping_address: DataTypes.STRING,
      shipping_city: DataTypes.STRING,
      shipping_province: DataTypes.STRING,
      shipping_zip: DataTypes.STRING,
      shipping_notes: DataTypes.TEXT,
      // true mientras el pedido tiene unidades apartadas; se pone en false al liberarlas
      stock_reserved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      // Si para esta fecha no hay pago, se libera el stock (ver releaseExpiredOrders)
      expires_at: { type: DataTypes.DATE, allowNull: true }
    },
    {
      sequelize,
      modelName: 'Order',
      tableName: 'orders',
      timestamps: true
    }
  );

  return Order;
};
