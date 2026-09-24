const { MadurezScm } = require('../models');

const CAMPOS = [
  'productos_proveedores_integrados',
  'inventario_funcionando',
  'trazabilidad_movimientos',
  'estrategia_push_pull_implementada',
  'reportes_y_metricas',
];

async function obtenerOCrearFila() {
  let fila = await MadurezScm.findOne();
  if (!fila) fila = await MadurezScm.create({});
  return fila;
}

function calcularNivel(fila) {
  const completados = CAMPOS.filter(campo => fila[campo]).length;
  if (completados <= 1) return 'Inicial';
  if (completados <= 4) return 'En desarrollo';
  return 'Optimizado';
}

async function obtenerMadurez(req, res) {
  try {
    const fila = await obtenerOCrearFila();
    return res.json({ ...fila.toJSON(), nivel: calcularNivel(fila) });
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener el nivel de madurez', detalle: err.message });
  }
}

async function actualizarMadurez(req, res) {
  try {
    const fila = await obtenerOCrearFila();
    const cambios = {};
    for (const campo of CAMPOS) {
      if (typeof req.body[campo] === 'boolean') cambios[campo] = req.body[campo];
    }
    await fila.update(cambios);
    return res.json({ ...fila.toJSON(), nivel: calcularNivel(fila) });
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar el nivel de madurez', detalle: err.message });
  }
}

module.exports = { obtenerMadurez, actualizarMadurez };
