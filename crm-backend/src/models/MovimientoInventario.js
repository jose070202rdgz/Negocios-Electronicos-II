const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Cada fila es UNA entrada o salida de almacén. El stock_actual del
// producto se recalcula automáticamente cada vez que se crea un movimiento
// (ver movimientoController.js) — así el historial y el stock nunca se desincronizan.
const MovimientoInventario = sequelize.define('MovimientoInventario', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  producto_id: { type: DataTypes.INTEGER, allowNull: false },
  tipo: { type: DataTypes.ENUM('entrada', 'salida'), allowNull: false },
  cantidad: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  motivo: { type: DataTypes.STRING(255), allowNull: true },
  fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'movimientos_inventario', timestamps: true });

module.exports = MovimientoInventario;
