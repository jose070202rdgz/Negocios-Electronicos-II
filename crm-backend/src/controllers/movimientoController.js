const { MovimientoInventario, Producto, Usuario, sequelize } = require('../models');

// POST /movimientos
// Crea el movimiento Y ajusta producto.stock_actual dentro de una misma
// transacción: si algo falla a la mitad, no queda el stock desfasado
// respecto al historial (ni viceversa).
async function crearMovimiento(req, res) {
  const t = await sequelize.transaction();
  try {
    const { producto_id, tipo, cantidad, motivo, fecha } = req.body;

    if (!producto_id || !tipo || !cantidad) {
      await t.rollback();
      return res.status(400).json({ error: 'producto_id, tipo y cantidad son obligatorios' });
    }
    if (!['entrada', 'salida'].includes(tipo)) {
      await t.rollback();
      return res.status(400).json({ error: 'tipo debe ser "entrada" o "salida"' });
    }
    if (Number(cantidad) <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
    }

    const producto = await Producto.findByPk(producto_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!producto) {
      await t.rollback();
      return res.status(404).json({ error: 'El producto indicado no existe' });
    }

    if (tipo === 'salida' && producto.stock_actual < cantidad) {
      await t.rollback();
      return res.status(400).json({ error: `Stock insuficiente. Disponible: ${producto.stock_actual}` });
    }

    const nuevoStock = tipo === 'entrada'
      ? producto.stock_actual + Number(cantidad)
      : producto.stock_actual - Number(cantidad);

    producto.stock_actual = nuevoStock;
    await producto.save({ transaction: t });

    const movimiento = await MovimientoInventario.create({
      producto_id,
      tipo,
      cantidad,
      motivo,
      fecha: fecha || new Date(),
      usuario_id: req.usuario.id,
    }, { transaction: t });

    await t.commit();
    return res.status(201).json({ movimiento, stock_actual: nuevoStock });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: 'Error al registrar el movimiento', detalle: err.message });
  }
}

// GET /movimientos?tipo=&producto_id=
async function listarMovimientos(req, res) {
  try {
    const { tipo, producto_id } = req.query;
    const where = {};
    if (tipo) where.tipo = tipo;
    if (producto_id) where.producto_id = producto_id;

    const movimientos = await MovimientoInventario.findAll({
      where,
      include: [
        { model: Producto, as: 'producto', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] },
      ],
      order: [['fecha', 'DESC']],
    });

    return res.json(movimientos);
  } catch (err) {
    return res.status(500).json({ error: 'Error al listar movimientos', detalle: err.message });
  }
}

module.exports = { crearMovimiento, listarMovimientos };
