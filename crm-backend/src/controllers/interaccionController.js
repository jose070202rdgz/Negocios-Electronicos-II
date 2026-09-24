const { Interaccion, Cliente, Usuario } = require('../models');

async function crearInteraccion(req, res) {
  try {
    const { cliente_id, tipo, descripcion, fecha } = req.body;
    const tiposValidos = ['llamada', 'correo', 'reunion'];
    if (!cliente_id || !tipo || !descripcion) return res.status(400).json({ error: 'cliente_id, tipo y descripcion son obligatorios' });
    if (!tiposValidos.includes(tipo)) return res.status(400).json({ error: `tipo debe ser una de: ${tiposValidos.join(', ')}` });
    const cliente = await Cliente.findByPk(cliente_id);
    if (!cliente) return res.status(404).json({ error: 'El cliente indicado no existe' });
    const interaccion = await Interaccion.create({ cliente_id, tipo, descripcion, fecha: fecha || new Date(), usuario_id: req.usuario.id });
    return res.status(201).json(interaccion);
  } catch (err) {
    return res.status(500).json({ error: 'Error al registrar interacción', detalle: err.message });
  }
}

async function listarInteraccionesPorCliente(req, res) {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    const interacciones = await Interaccion.findAll({
      where: { cliente_id: req.params.id },
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo'] }],
      order: [['fecha', 'DESC']],
    });
    return res.json(interacciones);
  } catch (err) {
    return res.status(500).json({ error: 'Error al listar interacciones', detalle: err.message });
  }
}

async function listarMiActividad(req, res) {
  try {
    const interacciones = await Interaccion.findAll({
      where: { usuario_id: req.usuario.id },
      include: [{ model: Cliente, as: 'cliente', attributes: ['id', 'nombre', 'empresa'] }],
      order: [['fecha', 'DESC']],
    });
    return res.json(interacciones);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener actividad', detalle: err.message });
  }
}

async function listarTodas(req, res) {
  try {
    const interacciones = await Interaccion.findAll({
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'nombre', 'empresa'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] },
      ],
      order: [['fecha', 'DESC']],
    });
    return res.json(interacciones);
  } catch (err) {
    return res.status(500).json({ error: 'Error al listar interacciones', detalle: err.message });
  }
}

module.exports = { crearInteraccion, listarInteraccionesPorCliente, listarMiActividad, listarTodas };
