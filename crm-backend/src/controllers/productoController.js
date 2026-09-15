const { Op } = require('sequelize');
const { Producto } = require('../models');

function normalizarEtiquetas(etiquetas) {
  if (Array.isArray(etiquetas)) return etiquetas.filter(Boolean).map(String).slice(0, 6);
  if (typeof etiquetas === 'string') return etiquetas.split(',').map(etiqueta => etiqueta.trim()).filter(Boolean).slice(0, 6);
  return [];
}

async function listarProductos(req, res) {
  try {
    const where = { activo: true };
    if (req.query.busqueda) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${req.query.busqueda}%` } },
        { categoria: { [Op.like]: `%${req.query.busqueda}%` } },
        { descripcion: { [Op.like]: `%${req.query.busqueda}%` } },
      ];
    }
    if (req.query.categoria) where.categoria = req.query.categoria;

    const productos = await Producto.findAll({ where, order: [['createdAt', 'DESC']] });
    return res.json(productos);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener el catálogo', detalle: err.message });
  }
}

async function crearProducto(req, res) {
  try {
    const { nombre, categoria, presentacion, descripcion, precio, imagen, etiquetas } = req.body;
    if (!nombre?.trim() || !presentacion?.trim() || !descripcion?.trim() || precio === undefined || precio === '') {
      return res.status(400).json({ error: 'Nombre, presentación, descripción y precio son obligatorios' });
    }
    if (Number.isNaN(Number(precio)) || Number(precio) < 0) {
      return res.status(400).json({ error: 'El precio debe ser un número mayor o igual a cero' });
    }

    const producto = await Producto.create({
      nombre: nombre.trim(),
      categoria: categoria?.trim() || 'Limpieza industrial',
      presentacion: presentacion.trim(),
      descripcion: descripcion.trim(),
      precio: Number(precio),
      imagen: imagen?.trim() || null,
      etiquetas: normalizarEtiquetas(etiquetas),
    });
    return res.status(201).json(producto);
  } catch (err) {
    return res.status(500).json({ error: 'Error al crear el producto', detalle: err.message });
  }
}

async function actualizarProducto(req, res) {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    const { nombre, categoria, presentacion, descripcion, precio, imagen, etiquetas, activo } = req.body;
    if (precio !== undefined && (Number.isNaN(Number(precio)) || Number(precio) < 0)) {
      return res.status(400).json({ error: 'El precio debe ser un número mayor o igual a cero' });
    }
    await producto.update({
      ...(nombre !== undefined && { nombre: nombre.trim() }),
      ...(categoria !== undefined && { categoria: categoria.trim() }),
      ...(presentacion !== undefined && { presentacion: presentacion.trim() }),
      ...(descripcion !== undefined && { descripcion: descripcion.trim() }),
      ...(precio !== undefined && { precio: Number(precio) }),
      ...(imagen !== undefined && { imagen: imagen?.trim() || null }),
      ...(etiquetas !== undefined && { etiquetas: normalizarEtiquetas(etiquetas) }),
      ...(activo !== undefined && { activo: Boolean(activo) }),
    });
    return res.json(producto);
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar el producto', detalle: err.message });
  }
}

async function eliminarProducto(req, res) {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    await producto.update({ activo: false });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Error al eliminar el producto', detalle: err.message });
  }
}

module.exports = { listarProductos, crearProducto, actualizarProducto, eliminarProducto };