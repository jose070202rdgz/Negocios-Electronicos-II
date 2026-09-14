const { Op, fn, col } = require('sequelize');
const { Cliente, Interaccion } = require('../models');

async function obtenerMetricas(req, res) {
  try {
    const totalClientes = await Cliente.count();
    const clientesActivos = await Cliente.count({ where: { estado: 'activo' } });
    const clientesInactivos = await Cliente.count({ where: { estado: 'inactivo' } });

    const interaccionesPorCliente = await Interaccion.findAll({
      attributes: ['cliente_id', [fn('COUNT', col('Interaccion.id')), 'total_interacciones']],
      group: ['cliente_id'],
      include: [{ model: Cliente, as: 'cliente', attributes: ['nombre', 'empresa'] }],
      order: [[fn('COUNT', col('Interaccion.id')), 'DESC']],
    });

    const interaccionesPorTipo = await Interaccion.findAll({
      attributes: ['tipo', [fn('COUNT', col('id')), 'total']],
      group: ['tipo'],
    });

    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    const todosLosClientes = await Cliente.findAll({
      attributes: ['id', 'nombre', 'empresa', 'estado', 'etapa_crm'],
      include: [{
        model: Interaccion,
        as: 'interacciones',
        attributes: ['fecha'],
        required: false,
      }],
    });

    const clientesEnRiesgo = todosLosClientes
      .filter(cliente => {
        const fechas = cliente.interacciones.map(i => new Date(i.fecha));
        if (fechas.length === 0) return true;
        const ultima = new Date(Math.max(...fechas));
        return ultima < hace30Dias;
      })
      .map(c => ({ id: c.id, nombre: c.nombre, empresa: c.empresa, etapa_crm: c.etapa_crm }));

    return res.json({
      total_clientes: totalClientes,
      clientes_activos: clientesActivos,
      clientes_inactivos: clientesInactivos,
      interacciones_por_cliente: interaccionesPorCliente,
      interacciones_por_tipo: interaccionesPorTipo,
      clientes_sin_interaccion_reciente: clientesEnRiesgo,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error al calcular métricas', detalle: err.message });
  }
}

module.exports = { obtenerMetricas };
