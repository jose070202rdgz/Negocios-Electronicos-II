const { fn, col, Op } = require('sequelize');
const { Producto, Proveedor, Pedido, MovimientoInventario } = require('../models');

// GET /scm/metricas
async function obtenerMetricasScm(req, res) {
  try {
    const totalProductos = await Producto.count();
    const totalProveedores = await Proveedor.count();
    const pedidosEnProceso = await Pedido.count({ where: { estado: 'en_proceso' } });

    const productos = await Producto.findAll();
    const productosStockBajo = productos.filter(p => p.stock_actual <= p.stock_minimo);

    // Productos más vendidos = suma de salidas de inventario por producto
    const masVendidos = await MovimientoInventario.findAll({
      where: { tipo: 'salida' },
      attributes: ['producto_id', [fn('SUM', col('cantidad')), 'total_vendido']],
      group: ['producto_id'],
      include: [{ model: Producto, as: 'producto', attributes: ['nombre'] }],
      order: [[fn('SUM', col('cantidad')), 'DESC']],
      limit: 10,
    });

    // Rotación de inventario: qué proporción del stock disponible + vendido
    // realmente salió (rota) en el histórico. Es una definición simplificada
    // y ajustable — no sustituye una fórmula financiera formal de rotación.
    let totalSalidas = 0;
    let totalDisponibleMasSalidas = 0;
    const clasificacion = { alta: 0, media: 0, baja: 0 };

    for (const p of productos) {
      const salidasProducto = await MovimientoInventario.sum('cantidad', { where: { producto_id: p.id, tipo: 'salida' } }) || 0;
      const base = p.stock_actual + salidasProducto;
      const ratio = base > 0 ? salidasProducto / base : 0;

      totalSalidas += salidasProducto;
      totalDisponibleMasSalidas += base;

      if (ratio >= 0.6) clasificacion.alta += 1;
      else if (ratio >= 0.25) clasificacion.media += 1;
      else clasificacion.baja += 1;
    }

    const rotacionGeneralPct = totalDisponibleMasSalidas > 0
      ? Math.round((totalSalidas / totalDisponibleMasSalidas) * 100)
      : 0;

    const productosPush = await Producto.count({ where: { estrategia_logistica: 'PUSH' } });
    const productosPull = await Producto.count({ where: { estrategia_logistica: 'PULL' } });

    return res.json({
      total_productos: totalProductos,
      total_proveedores: totalProveedores,
      pedidos_en_proceso: pedidosEnProceso,
      productos_stock_bajo: productosStockBajo.map(p => ({ id: p.id, nombre: p.nombre, stock_actual: p.stock_actual, stock_minimo: p.stock_minimo })),
      productos_mas_vendidos: masVendidos.map(m => ({
        producto_id: m.producto_id,
        nombre: m.producto?.nombre ?? `Producto #${m.producto_id}`,
        total_vendido: Number(m.get('total_vendido')),
      })),
      rotacion_inventario: {
        porcentaje_general: rotacionGeneralPct,
        alta_rotacion: clasificacion.alta,
        rotacion_media: clasificacion.media,
        rotacion_baja: clasificacion.baja,
      },
      comparativa_push_pull: { push: productosPush, pull: productosPull },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error al calcular métricas SCM', detalle: err.message });
  }
}

module.exports = { obtenerMetricasScm };
