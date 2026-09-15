const sequelize = require('../config/database');
const Cliente = require('./Cliente');
const Usuario = require('./Usuario');
const Interaccion = require('./Interaccion');
const Producto = require('./Producto');

Cliente.hasMany(Interaccion, { foreignKey: 'cliente_id', as: 'interacciones', onDelete: 'CASCADE' });
Interaccion.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });

Usuario.hasMany(Interaccion, { foreignKey: 'usuario_id', as: 'interaccionesRegistradas' });
Interaccion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

module.exports = { sequelize, Cliente, Usuario, Interaccion, Producto };
