'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // Solicitud del "botón de arrepentimiento": el cliente cancela una compra dentro de los 10 días
  class WithdrawalRequest extends Model {}

  WithdrawalRequest.init(
    {
      code: { type: DataTypes.STRING, allowNull: false, unique: true },
      order_id: { type: DataTypes.INTEGER, allowNull: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      reason: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' }
    },
    {
      sequelize,
      modelName: 'WithdrawalRequest',
      tableName: 'withdrawal_requests',
      timestamps: true
    }
  );

  return WithdrawalRequest;
};
