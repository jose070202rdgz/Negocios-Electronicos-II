const { Op } = require('sequelize');
const { Proveedor } = require('../models');

async function crearProveedor(req, res) {
  try {
    const { nombre, contacto, correo, telefono, direccion } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const proveedor = await Proveedor.create({ nombre, contacto, correo, telefono, direccion });
    return res.status(201).json(proveedor);
  } catch (err) {
    if (err.name === 'SequelizeValidationError') return res.status(400).json({ error: err.errors.map(e => e.message) });
    return res.status(500).json({ error: 'Error al crear proveedor', detalle: err.message });
  }
}

async function listarProveedores(req, res) {
  try {
    const { busqueda } = req.query;
    const where = {};
    if (busqueda) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${busqueda}%` } },
        { contacto: { [Op.like]: `%${busqueda}%` } },
        { correo: { [Op.like]: `%${busqueda}%` } },
      ];
    }
    const proveedores = await Proveedor.findAll({ where, order: [['nombre', 'ASC']] });
    return res.json(proveedores);
  } catch (err) {
    return res.status(500).json({ error: 'Error al listar proveedores', detalle: err.message });
  }
}

async function obtenerProveedor(req, res) {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
    return res.json(proveedor);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener proveedor', detalle: err.message });
  }
}

async function actualizarProveedor(req, res) {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
    const { nombre, contacto, correo, telefono, direccion } = req.body;
    await proveedor.update({
      nombre: nombre ?? proveedor.nombre,
      contacto: contacto ?? proveedor.contacto,
      correo: correo ?? proveedor.correo,
      telefono: telefono ?? proveedor.telefono,
      direccion: direccion ?? proveedor.direccion,
    });
    return res.json(proveedor);
  } catch (err) {
    if (err.name === 'SequelizeValidationError') return res.status(400).json({ error: err.errors.map(e => e.message) });
    return res.status(500).json({ error: 'Error al actualizar proveedor', detalle: err.message });
  }
}

async function eliminarProveedor(req, res) {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
    await proveedor.destroy();
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Error al eliminar proveedor', detalle: err.message });
  }
}

module.exports = { crearProveedor, listarProveedores, obtenerProveedor, actualizarProveedor, eliminarProveedor };
