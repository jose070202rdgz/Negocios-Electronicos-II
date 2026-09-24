const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pedido = sequelize.define('Pedido', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  folio: { type: DataTypes.STRING(20), allowNull: false, unique: true }, // ej. PC-001, autogenerado
  producto_id: { type: DataTypes.INTEGER, allowNull: false },
  proveedor_id: { type: DataTypes.INTEGER, allowNull: true },
  cantidad: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  tipo: { type: DataTypes.ENUM('reposicion', 'venta'), allowNull: false, defaultValue: 'reposicion' },
  estado: { type: DataTypes.ENUM('pendiente', 'en_proceso', 'surtido', 'cancelado'), allowNull: false, defaultValue: 'pendiente' },
  fecha: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  notas: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'pedidos', timestamps: true });

module.exports = Pedido;
