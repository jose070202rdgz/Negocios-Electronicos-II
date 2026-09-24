const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Proveedor = sequelize.define('Proveedor', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(150), allowNull: false, validate: { notEmpty: { msg: 'El nombre es obligatorio' } } },
  contacto: { type: DataTypes.STRING(150), allowNull: true },
  correo: { type: DataTypes.STRING(150), allowNull: true, validate: { isEmail: { msg: 'El correo no es válido' } } },
  telefono: { type: DataTypes.STRING(20), allowNull: true },
  direccion: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'proveedores', timestamps: true });

module.exports = Proveedor;
