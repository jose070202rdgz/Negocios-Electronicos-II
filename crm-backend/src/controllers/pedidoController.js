const { Pedido, Producto, Proveedor } = require('../models');

async function generarFolio() {
  const ultimo = await Pedido.findOne({ order: [['id', 'DESC']] });
  const siguiente = ultimo ? ultimo.id + 1 : 1;
  return `PC-${String(siguiente).padStart(3, '0')}`;
}

// POST /pedidos
async function crearPedido(req, res) {
  try {
    const { producto_id, proveedor_id, cantidad, tipo, fecha, notas } = req.body;
    if (!producto_id || !cantidad) return res.status(400).json({ error: 'producto_id y cantidad son obligatorios' });

    const producto = await Producto.findByPk(producto_id);
    if (!producto) return res.status(404).json({ error: 'El producto indicado no existe' });

    const folio = await generarFolio();

    const pedido = await Pedido.create({
      folio,
      producto_id,
      proveedor_id: proveedor_id || null,
      cantidad,
      tipo: tipo === 'venta' ? 'venta' : 'reposicion',
      estado: 'pendiente',
      fecha: fecha || new Date(),
      notas,
    });

    return res.status(201).json(pedido);
  } catch (err) {
    if (err.name === 'SequelizeValidationError') return res.status(400).json({ error: err.errors.map(e => e.message) });
    return res.status(500).json({ error: 'Error al crear pedido', detalle: err.message });
  }
}

// GET /pedidos?estado=&tipo=
async function listarPedidos(req, res) {
  try {
    const { estado, tipo } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;

    const pedidos = await Pedido.findAll({
      where,
      include: [
        { model: Producto, as: 'producto', attributes: ['id', 'nombre'] },
        { model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'] },
      ],
      order: [['fecha', 'DESC']],
    });

    return res.json(pedidos);
  } catch (err) {
    return res.status(500).json({ error: 'Error al listar pedidos', detalle: err.message });
  }
}

// PUT /pedidos/:id — editar cantidad/tipo/notas
async function actualizarPedido(req, res) {
  try {
    const pedido = await Pedido.findByPk(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    const { cantidad, tipo, proveedor_id, notas } = req.body;
    await pedido.update({
      cantidad: cantidad ?? pedido.cantidad,
      tipo: tipo ?? pedido.tipo,
      proveedor_id: proveedor_id ?? pedido.proveedor_id,
      notas: notas ?? pedido.notas,
    });

    return res.json(pedido);
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar pedido', detalle: err.message });
  }
}

// PUT /pedidos/:id/estado — Pendiente → En proceso → Surtido / Cancelado
async function actualizarEstadoPedido(req, res) {
  try {
    const { estado } = req.body;
    const estadosValidos = ['pendiente', 'en_proceso', 'surtido', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: `estado debe ser una de: ${estadosValidos.join(', ')}` });
    }
    const pedido = await Pedido.findByPk(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    pedido.estado = estado;
    await pedido.save();
    return res.json(pedido);
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar el estado', detalle: err.message });
  }
}

// DELETE /pedidos/:id
async function eliminarPedido(req, res) {
  try {
    const pedido = await Pedido.findByPk(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    await pedido.destroy();
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Error al eliminar pedido', detalle: err.message });
  }
}

module.exports = { crearPedido, listarPedidos, actualizarPedido, actualizarEstadoPedido, eliminarPedido };
