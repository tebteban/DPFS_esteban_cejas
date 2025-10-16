'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Brand extends Model {
    static associate(models) {
      // 🔹 Una marca tiene muchos productos
      Brand.hasMany(models.Product, {
        as: 'products',
        foreignKey: 'brand_id'
      });
    }
  }

  Brand.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          len: [2, 100]
        }
      }
    },
    {
      sequelize,
      modelName: 'Brand',
      tableName: 'brands',
      timestamps: false // igual que Category, lo podés activar si querés
    }
  );

  return Brand;
};
