const { Pedido, Producto, Proveedor, MovimientoInventario, sequelize } = require('../models');
const { crearPedidoReposicion, generarFolio } = require('../services/pedidoService');

async function crearPedido(req, res) {
  const t = await sequelize.transaction();
  try {
    const { producto_id, proveedor_id, cantidad, tipo, fecha, notas } = req.body;
    if (!producto_id || !cantidad) { await t.rollback(); return res.status(400).json({ error: 'producto_id y cantidad son obligatorios' }); }
    if (Number(cantidad) <= 0) { await t.rollback(); return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' }); }

    const producto = await Producto.findByPk(producto_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!producto) { await t.rollback(); return res.status(404).json({ error: 'El producto indicado no existe' }); }
    const tipoPedido = tipo === 'venta' ? 'venta' : 'reposicion';
    if (tipoPedido === 'reposicion' && producto.estrategia_logistica !== 'PULL') {
      await t.rollback();
      return res.status(400).json({ error: 'Los pedidos PUSH se generan automáticamente; solo los productos PULL admiten pedidos manuales' });
    }
    if (tipoPedido === 'reposicion' && !producto.proveedor_id) {
      await t.rollback();
      return res.status(400).json({ error: 'El producto no tiene un proveedor asignado' });
    }
    if (proveedor_id && producto.proveedor_id && Number(proveedor_id) !== producto.proveedor_id) {
      await t.rollback();
      return res.status(400).json({ error: 'El pedido debe usar el proveedor ligado al producto' });
    }

    let pedido;
    if (tipoPedido === 'reposicion') {
      pedido = await crearPedidoReposicion({
        producto,
        proveedorId: producto.proveedor_id,
        cantidad: Number(cantidad),
        estrategia: 'PULL',
        notas,
        usuarioId: req.usuario.id,
        transaction: t,
      });
      if (fecha) await pedido.update({ fecha }, { transaction: t });
    } else {
      pedido = await Pedido.create({
        folio: await generarFolio(t),
        producto_id,
        proveedor_id: proveedor_id || producto.proveedor_id || null,
        cantidad,
        tipo: tipoPedido,
        estado: 'pendiente',
        fecha: fecha || new Date(),
        notas,
      }, { transaction: t });
    }

    await t.commit();
    return res.status(201).json(pedido);
  } catch (err) {
    if (!t.finished) await t.rollback();
    if (err.name === 'SequelizeValidationError') return res.status(400).json({ error: err.errors.map(e => e.message) });
    return res.status(500).json({ error: 'Error al crear pedido', detalle: err.message });
  }
}

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

async function actualizarPedido(req, res) {
  try {
    const pedido = await Pedido.findByPk(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    const { cantidad, tipo, proveedor_id, notas } = req.body;
    const producto = await Producto.findByPk(pedido.producto_id);
    const tipoPedido = tipo ?? pedido.tipo;
    if (tipoPedido === 'reposicion' && producto?.estrategia_logistica !== 'PULL') {
      return res.status(400).json({ error: 'Solo los productos PULL admiten pedidos manuales de reposición' });
    }
    if (tipoPedido === 'reposicion' && !producto?.proveedor_id) {
      return res.status(400).json({ error: 'El producto no tiene un proveedor asignado' });
    }
    if (proveedor_id && producto?.proveedor_id && Number(proveedor_id) !== producto.proveedor_id) {
      return res.status(400).json({ error: 'El pedido debe usar el proveedor ligado al producto' });
    }
    await pedido.update({
      cantidad: cantidad ?? pedido.cantidad,
      tipo: tipoPedido,
      proveedor_id: producto?.proveedor_id ?? proveedor_id ?? pedido.proveedor_id,
      notas: notas ?? pedido.notas,
    });

    return res.json(pedido);
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar pedido', detalle: err.message });
  }
}

async function actualizarEstadoPedido(req, res) {
  const t = await sequelize.transaction();
  try {
    const { estado } = req.body;
    const estadosValidos = ['pendiente', 'en_proceso', 'surtido', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      await t.rollback();
      return res.status(400).json({ error: `estado debe ser una de: ${estadosValidos.join(', ')}` });
    }
    const pedido = await Pedido.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!pedido) { await t.rollback(); return res.status(404).json({ error: 'Pedido no encontrado' }); }
    const estadoAnterior = pedido.estado;
    if (estado === 'surtido' && estadoAnterior !== 'surtido' && pedido.tipo === 'reposicion') {
      const producto = await Producto.findByPk(pedido.producto_id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!producto) { await t.rollback(); return res.status(404).json({ error: 'El producto del pedido ya no existe' }); }
      producto.stock_actual += pedido.cantidad;
      await producto.save({ transaction: t });
      await MovimientoInventario.create({
        producto_id: producto.id,
        tipo: 'entrada',
        cantidad: pedido.cantidad,
        motivo: `Recepción del pedido ${pedido.folio}`,
        fecha: new Date(),
        usuario_id: req.usuario.id,
      }, { transaction: t });
    }
    pedido.estado = estado;
    await pedido.save({ transaction: t });
    await t.commit();
    return res.json(pedido);
  } catch (err) {
    if (!t.finished) await t.rollback();
    return res.status(500).json({ error: 'Error al actualizar el estado', detalle: err.message });
  }
}

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
