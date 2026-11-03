'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      // 🔹 Un producto pertenece a una categoría
      Product.belongsTo(models.Category, {
        as: 'category',
        foreignKey: 'category_id'
      });

      // 🔹 Un producto pertenece a una marca
      Product.belongsTo(models.Brand, {
        as: 'brand',
        foreignKey: 'brand_id'
      });

      // 🔹 Un producto tiene fotos extra para la galería
      Product.hasMany(models.ProductImage, {
        as: 'images',
        foreignKey: 'product_id'
      });

      // 🔹 Un producto puede tener talles, cada uno con su stock
      Product.hasMany(models.ProductVariant, {
        as: 'variants',
        foreignKey: 'product_id'
      });

      // 🔹 Un producto pertenece a un usuario (creador)
      Product.belongsTo(models.User, {
        as: 'creator',
        foreignKey: 'user_id'
      });
    }
  }

  Product.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: true,
          min: 0
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          isInt: true,
          min: 0
        }
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      brand_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Product',
      tableName: 'products',
      timestamps: true
    }
  );

  // Talles del producto (hay que incluir 'variants' en la consulta); vacío = talle único
  Product.prototype.sizeList = function () {
    return (this.variants || []).map(v => v.size);
  };

  return Product;
};
