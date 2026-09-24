const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Interaccion = sequelize.define('Interaccion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  cliente_id: { type: DataTypes.INTEGER, allowNull: false },
  tipo: { type: DataTypes.ENUM('llamada', 'correo', 'reunion'), allowNull: false },
  descripcion: { type: DataTypes.TEXT, allowNull: false },
  fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'interacciones', timestamps: true });

module.exports = Interaccion;
