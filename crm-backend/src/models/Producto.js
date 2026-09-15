const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Producto = sequelize.define('Producto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  categoria: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Limpieza industrial',
  },
  presentacion: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 },
  },
  imagen: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  etiquetas: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'productos',
  timestamps: true,
});

module.exports = Producto;