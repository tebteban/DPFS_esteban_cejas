'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     */
    static associate(models) {
        // ASOCIACIÓN: Un Usuario tiene muchos Productos (hasMany)
        User.hasMany(models.Product, {
            as: 'products', // Alias para la relación
            foreignKey: 'user_id' // La clave foránea en la tabla 'products' que apunta a 'users'
        });
    }
  }
  User.init({
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    image: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true
  });
  return User;
};
