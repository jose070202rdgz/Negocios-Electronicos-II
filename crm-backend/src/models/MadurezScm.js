const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabla de una sola fila (singleton): guarda el checklist de madurez SCM.
// No se relaciona con nada más, es configuración global del módulo.
const MadurezScm = sequelize.define('MadurezScm', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  productos_proveedores_integrados: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  inventario_funcionando: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  trazabilidad_movimientos: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  estrategia_push_pull_implementada: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  reportes_y_metricas: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'madurez_scm', timestamps: true });

module.exports = MadurezScm;
