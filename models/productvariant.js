'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // Un talle de un producto con su propio stock. products.stock guarda la suma de todos los talles.
  class ProductVariant extends Model {
    static associate(models) {
      ProductVariant.belongsTo(models.Product, { as: 'product', foreignKey: 'product_id' });
    }
  }

  ProductVariant.init(
    {
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      size: { type: DataTypes.STRING, allowNull: false },
      stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } }
    },
    {
      sequelize,
      modelName: 'ProductVariant',
      tableName: 'product_variants',
      timestamps: false
    }
  );

  return ProductVariant;
};
