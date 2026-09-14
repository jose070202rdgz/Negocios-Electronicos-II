const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  apellido_paterno: {
    type: DataTypes.STRING(80),
    allowNull: false,
    defaultValue: '',
  },
  apellido_materno: {
    type: DataTypes.STRING(80),
    allowNull: false,
    defaultValue: '',
  },
  telefono: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: '',
  },
  correo: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  rol: {
    type: DataTypes.ENUM('admin', 'usuario'),
    allowNull: false,
    defaultValue: 'usuario',
  },
}, {
  tableName: 'usuarios',
  timestamps: true,
});

module.exports = Usuario;
