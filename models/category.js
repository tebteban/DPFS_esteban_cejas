'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      // 🔹 Una categoría tiene muchos productos
      Category.hasMany(models.Product, {
        as: 'products',
        foreignKey: 'category_id'
      });
    }
  }

  Category.init(
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
      modelName: 'Category',
      tableName: 'categories',
      timestamps: false // ⚙️ Podés poner true si querés createdAt/updatedAt
    }
  );

  return Category;
};
