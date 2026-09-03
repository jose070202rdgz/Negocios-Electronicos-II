const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cliente = sequelize.define('Cliente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { notEmpty: { msg: 'El nombre es obligatorio' } },
  },
  correo: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: { msg: 'El correo no es válido' } },
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  empresa: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  fecha_registro: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo'),
    allowNull: false,
    defaultValue: 'activo',
  },
  etapa_crm: {
    type: DataTypes.ENUM('Prospecto', 'Activo', 'Frecuente', 'Inactivo'),
    allowNull: false,
    defaultValue: 'Prospecto',
  },
}, {
  tableName: 'clientes',
  timestamps: true,
});

module.exports = Cliente;
