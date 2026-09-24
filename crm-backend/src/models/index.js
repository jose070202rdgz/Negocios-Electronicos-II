const sequelize = require('../config/database');
const Cliente = require('./Cliente');
const Usuario = require('./Usuario');
const Interaccion = require('./Interaccion');
const Proveedor = require('./Proveedor');
const Producto = require('./Producto');
const MovimientoInventario = require('./MovimientoInventario');
const Pedido = require('./Pedido');
const MadurezScm = require('./MadurezScm');

Cliente.hasMany(Interaccion, { foreignKey: 'cliente_id', as: 'interacciones', onDelete: 'CASCADE' });
Interaccion.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });

Usuario.hasMany(Interaccion, { foreignKey: 'usuario_id', as: 'interaccionesRegistradas' });
Interaccion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

Proveedor.hasMany(Producto, { foreignKey: 'proveedor_id', as: 'productos' });
Producto.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });

Producto.hasMany(MovimientoInventario, { foreignKey: 'producto_id', as: 'movimientos', onDelete: 'CASCADE' });
MovimientoInventario.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

Usuario.hasMany(MovimientoInventario, { foreignKey: 'usuario_id', as: 'movimientosRegistrados' });
MovimientoInventario.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

Producto.hasMany(Pedido, { foreignKey: 'producto_id', as: 'pedidos' });
Pedido.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

Proveedor.hasMany(Pedido, { foreignKey: 'proveedor_id', as: 'pedidos' });
Pedido.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });

module.exports = {
  sequelize,
  Cliente,
  Usuario,
  Interaccion,
  Proveedor,
  Producto,
  MovimientoInventario,
  Pedido,
  MadurezScm,
};
