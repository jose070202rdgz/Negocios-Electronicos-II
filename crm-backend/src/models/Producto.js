const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Producto = sequelize.define('Producto', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(150), allowNull: false, validate: { notEmpty: { msg: 'El nombre es obligatorio' } } },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  categoria: { type: DataTypes.STRING(100), allowNull: true },
  imagen_url: { type: DataTypes.STRING(500), allowNull: true },
  stock_actual: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  stock_minimo: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  costo_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  estrategia_logistica: { type: DataTypes.ENUM('PUSH', 'PULL'), allowNull: false, defaultValue: 'PUSH' },
  proveedor_id: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'productos', timestamps: true });

module.exports = Producto;
