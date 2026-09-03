const { Op } = require('sequelize');
const { Cliente, Interaccion } = require('../models');

async function crearCliente(req, res) {
  try {
    const { nombre, correo, telefono, empresa, estado, etapa_crm } = req.body;

    if (!nombre || !correo) {
      return res.status(400).json({ error: 'nombre y correo son obligatorios' });
    }

    const yaExiste = await Cliente.findOne({ where: { correo } });
    if (yaExiste) {
      return res.status(409).json({ error: 'Ya existe un cliente con ese correo' });
    }

    const cliente = await Cliente.create({
      nombre,
      correo,
      telefono,
      empresa,
      estado: estado || 'activo',
      etapa_crm: etapa_crm || 'Prospecto',
      fecha_registro: new Date(),
    });

    return res.status(201).json(cliente);
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: err.errors.map(e => e.message) });
    }
    return res.status(500).json({ error: 'Error al crear cliente', detalle: err.message });
  }
}

async function listarClientes(req, res) {
  try {
    const { busqueda, estado, etapa_crm, page = 1, limit = 20 } = req.query;

    const where = {};

    if (estado) where.estado = estado;
    if (etapa_crm) where.etapa_crm = etapa_crm;

    if (busqueda) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${busqueda}%` } },
        { correo: { [Op.like]: `%${busqueda}%` } },
        { empresa: { [Op.like]: `%${busqueda}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { rows, count } = await Cliente.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['fecha_registro', 'DESC']],
    });

    return res.json({
      total: count,
      pagina: Number(page),
      totalPaginas: Math.ceil(count / Number(limit)),
      clientes: rows,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error al listar clientes', detalle: err.message });
  }
}

async function obtenerCliente(req, res) {
  try {
    const cliente = await Cliente.findByPk(req.params.id, {
      include: [{ model: Interaccion, as: 'interacciones' }],
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    return res.json(cliente);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener cliente', detalle: err.message });
  }
}

async function actualizarCliente(req, res) {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const { nombre, correo, telefono, empresa, estado } = req.body;

    await cliente.update({
      nombre: nombre ?? cliente.nombre,
      correo: correo ?? cliente.correo,
      telefono: telefono ?? cliente.telefono,
      empresa: empresa ?? cliente.empresa,
      estado: estado ?? cliente.estado,
    });

    return res.json(cliente);
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: err.errors.map(e => e.message) });
    }
    return res.status(500).json({ error: 'Error al actualizar cliente', detalle: err.message });
  }
}

async function eliminarCliente(req, res) {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    await cliente.destroy();
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Error al eliminar cliente', detalle: err.message });
  }
}

async function actualizarEtapa(req, res) {
  try {
    const { etapa_crm } = req.body;
    const etapasValidas = ['Prospecto', 'Activo', 'Frecuente', 'Inactivo'];

    if (!etapasValidas.includes(etapa_crm)) {
      return res.status(400).json({ error: `etapa_crm debe ser una de: ${etapasValidas.join(', ')}` });
    }

    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    cliente.etapa_crm = etapa_crm;
    await cliente.save();

    return res.json(cliente);
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar etapa', detalle: err.message });
  }
}

module.exports = {
  crearCliente,
  listarClientes,
  obtenerCliente,
  actualizarCliente,
  eliminarCliente,
  actualizarEtapa,
};
