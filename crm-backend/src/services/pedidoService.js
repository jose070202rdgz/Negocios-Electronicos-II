const { Op } = require('sequelize');
const { Pedido, MovimientoInventario } = require('../models');
const STOCK_MINIMO = 5;
const STOCK_OBJETIVO_PUSH = 10;

async function generarFolio(transaction) {
  const ultimo = await Pedido.findOne({
    transaction,
    lock: transaction?.LOCK.UPDATE,
    order: [['id', 'DESC']],
  });
  return `PC-${String((ultimo?.id ?? 0) + 1).padStart(3, '0')}`;
}

async function crearPedidoReposicion({ producto, proveedorId, cantidad, estrategia, notas, usuarioId, transaction, estado = 'pendiente', motivoMovimiento }) {
  const folio = await generarFolio(transaction);
  const pedido = await Pedido.create({
    folio,
    producto_id: producto.id,
    proveedor_id: proveedorId,
    cantidad,
    tipo: 'reposicion',
    estado,
    fecha: new Date(),
    notas: notas || `Reposición ${estrategia} por stock bajo`,
  }, { transaction });

  await MovimientoInventario.create({
    producto_id: producto.id,
    tipo: 'entrada',
    cantidad,
    motivo: motivoMovimiento || `Pedido ${estrategia} ${folio} pendiente`,
    fecha: new Date(),
    usuario_id: usuarioId,
  }, { transaction });

  return pedido;
}

async function crearPedidoPushSiNecesario({ producto, usuarioId, transaction }) {
  if (producto.estrategia_logistica !== 'PUSH' || producto.stock_actual >= STOCK_MINIMO || !producto.proveedor_id) return null;

  const pedidoAbierto = await Pedido.findOne({
    where: {
      producto_id: producto.id,
      tipo: 'reposicion',
      estado: { [Op.in]: ['pendiente', 'en_proceso'] },
    },
    transaction,
    lock: transaction?.LOCK.UPDATE,
  });
  const cantidad = Math.max(STOCK_OBJETIVO_PUSH - Number(producto.stock_actual), 1);
  let pedido = pedidoAbierto;

  if (pedido) {
    pedido.cantidad = cantidad;
    pedido.proveedor_id = producto.proveedor_id;
    pedido.estado = 'surtido';
    pedido.notas = 'Reposición PUSH automática; stock restablecido a 10';
    await pedido.save({ transaction });

    const movimientoPendiente = await MovimientoInventario.findOne({
      where: { producto_id: producto.id, motivo: `Pedido PUSH ${pedido.folio} pendiente` },
      transaction,
      lock: transaction?.LOCK.UPDATE,
    });
    if (movimientoPendiente) {
      movimientoPendiente.cantidad = cantidad;
      movimientoPendiente.motivo = `Recepción automática del pedido PUSH ${pedido.folio}`;
      await movimientoPendiente.save({ transaction });
    } else {
      await MovimientoInventario.create({
        producto_id: producto.id,
        tipo: 'entrada',
        cantidad,
        motivo: `Recepción automática del pedido PUSH ${pedido.folio}`,
        fecha: new Date(),
        usuario_id: usuarioId,
      }, { transaction });
    }
  } else {
    pedido = await crearPedidoReposicion({
      producto,
      proveedorId: producto.proveedor_id,
      cantidad,
      estrategia: 'PUSH',
      notas: 'Reposición PUSH automática; stock restablecido a 10',
      usuarioId,
      transaction,
      estado: 'surtido',
      motivoMovimiento: 'Recepción automática PUSH; stock restablecido a 10',
    });
  }

  producto.stock_actual = STOCK_OBJETIVO_PUSH;
  await producto.save({ transaction });
  return pedido;
}

module.exports = { crearPedidoReposicion, crearPedidoPushSiNecesario, generarFolio };