'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProductImage extends Model {
    static associate(models) {
      ProductImage.belongsTo(models.Product, { as: 'product', foreignKey: 'product_id' });
    }
  }

  ProductImage.init(
    {
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      url: { type: DataTypes.STRING, allowNull: false },
      position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
    },
    {
      sequelize,
      modelName: 'ProductImage',
      tableName: 'product_images',
      timestamps: false
    }
  );

  return ProductImage;
};
