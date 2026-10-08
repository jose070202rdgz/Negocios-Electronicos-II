const { Op } = require('sequelize');
const { Producto, Proveedor, Pedido, MovimientoInventario, sequelize } = require('../models');
const { crearPedidoPushSiNecesario } = require('../services/pedidoService');

async function crearProducto(req, res) {
  const t = await sequelize.transaction();
  try {
    const { nombre, descripcion, categoria, imagen_url, stock_actual, stock_minimo, costo_unitario, estrategia_logistica, proveedor_id } = req.body;
    if (!nombre) { await t.rollback(); return res.status(400).json({ error: 'El nombre es obligatorio' }); }
    if (!proveedor_id) { await t.rollback(); return res.status(400).json({ error: 'Selecciona un proveedor para el producto' }); }
    const proveedor = await Proveedor.findByPk(proveedor_id, { transaction: t });
    if (!proveedor) { await t.rollback(); return res.status(400).json({ error: 'El proveedor seleccionado no existe' }); }

    const producto = await Producto.create({
      nombre,
      descripcion,
      categoria,
      imagen_url,
      stock_actual: stock_actual ?? 0,
      stock_minimo: 5,
      costo_unitario: costo_unitario || 0,
      estrategia_logistica: estrategia_logistica === 'PULL' ? 'PULL' : 'PUSH',
      proveedor_id: proveedor_id || null,
    }, { transaction: t });

    const pedidoAutomatico = await crearPedidoPushSiNecesario({ producto, usuarioId: req.usuario.id, transaction: t });
    await t.commit();

    return res.status(201).json({ ...producto.toJSON(), pedido_automatico: pedidoAutomatico });
  } catch (err) {
    if (!t.finished) await t.rollback();
    if (err.name === 'SequelizeValidationError') return res.status(400).json({ error: err.errors.map(e => e.message) });
    return res.status(500).json({ error: 'Error al crear producto', detalle: err.message });
  }
}

async function listarProductos(req, res) {
  try {
    const { busqueda, categoria, estrategia_logistica } = req.query;
    const where = {};
    if (categoria) where.categoria = categoria;
    if (estrategia_logistica) where.estrategia_logistica = estrategia_logistica;
    if (busqueda) where.nombre = { [Op.like]: `%${busqueda}%` };

    const productos = await Producto.findAll({
      where,
      include: [{ model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'] }],
      order: [['nombre', 'ASC']],
    });

    const conEstado = productos.map(p => {
      const json = p.toJSON();
      json.stock_minimo = 5;
      json.estado_inventario = json.stock_actual < 5 ? 'Stock bajo' : 'Normal';
      return json;
    });

    return res.json(conEstado);
  } catch (err) {
    return res.status(500).json({ error: 'Error al listar productos', detalle: err.message });
  }
}

async function obtenerProducto(req, res) {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [{ model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'] }],
    });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    return res.json(producto);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener producto', detalle: err.message });
  }
}

async function actualizarProducto(req, res) {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    const { nombre, descripcion, categoria, imagen_url, costo_unitario, proveedor_id } = req.body;
    const proveedorId = proveedor_id ?? producto.proveedor_id;
    if (!proveedorId) return res.status(400).json({ error: 'Selecciona un proveedor para el producto' });
    const proveedor = await Proveedor.findByPk(proveedorId);
    if (!proveedor) return res.status(400).json({ error: 'El proveedor seleccionado no existe' });
    await producto.update({
      nombre: nombre ?? producto.nombre,
      descripcion: descripcion ?? producto.descripcion,
      categoria: categoria ?? producto.categoria,
      imagen_url: imagen_url ?? producto.imagen_url,
      stock_minimo: 5,
      costo_unitario: costo_unitario ?? producto.costo_unitario,
      proveedor_id: proveedorId,
    });

    return res.json(producto);
  } catch (err) {
    if (err.name === 'SequelizeValidationError') return res.status(400).json({ error: err.errors.map(e => e.message) });
    return res.status(500).json({ error: 'Error al actualizar producto', detalle: err.message });
  }
}

async function eliminarProducto(req, res) {
  const t = await sequelize.transaction();
  try {
    const producto = await Producto.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!producto) { await t.rollback(); return res.status(404).json({ error: 'Producto no encontrado' }); }
    await Pedido.destroy({ where: { producto_id: producto.id }, transaction: t });
    await MovimientoInventario.destroy({ where: { producto_id: producto.id }, transaction: t });
    await producto.destroy({ transaction: t });
    await t.commit();
    return res.status(204).send();
  } catch (err) {
    if (!t.finished) await t.rollback();
    return res.status(500).json({ error: 'Error al eliminar producto', detalle: err.message });
  }
}

async function actualizarEstrategia(req, res) {
  if (!['PUSH', 'PULL'].includes(req.body.estrategia_logistica)) {
    return res.status(400).json({ error: 'estrategia_logistica debe ser PUSH o PULL' });
  }
  const t = await sequelize.transaction();
  try {
    const { estrategia_logistica } = req.body;
    const producto = await Producto.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!producto) { await t.rollback(); return res.status(404).json({ error: 'Producto no encontrado' }); }
    producto.estrategia_logistica = estrategia_logistica;
    await producto.save({ transaction: t });
    const pedidoAutomatico = await crearPedidoPushSiNecesario({ producto, usuarioId: req.usuario.id, transaction: t });
    await t.commit();
    return res.json({ ...producto.toJSON(), pedido_automatico: pedidoAutomatico });
  } catch (err) {
    if (!t.finished) await t.rollback();
    return res.status(500).json({ error: 'Error al actualizar la estrategia', detalle: err.message });
  }
}

module.exports = { crearProducto, listarProductos, obtenerProducto, actualizarProducto, eliminarProducto, actualizarEstrategia };
