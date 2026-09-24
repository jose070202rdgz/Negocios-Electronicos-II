const { Op } = require('sequelize');
const { Producto, Proveedor } = require('../models');

// POST /productos
async function crearProducto(req, res) {
  try {
    const { nombre, descripcion, categoria, imagen_url, stock_actual, stock_minimo, costo_unitario, estrategia_logistica, proveedor_id } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const producto = await Producto.create({
      nombre,
      descripcion,
      categoria,
      imagen_url,
      stock_actual: stock_actual || 0,
      stock_minimo: stock_minimo || 0,
      costo_unitario: costo_unitario || 0,
      estrategia_logistica: estrategia_logistica === 'PULL' ? 'PULL' : 'PUSH',
      proveedor_id: proveedor_id || null,
    });

    return res.status(201).json(producto);
  } catch (err) {
    if (err.name === 'SequelizeValidationError') return res.status(400).json({ error: err.errors.map(e => e.message) });
    return res.status(500).json({ error: 'Error al crear producto', detalle: err.message });
  }
}

// GET /productos?busqueda=&categoria=&estrategia_logistica=
async function listarProductos(req, res) {
  try {
    const { busqueda, categoria, estrategia_logistica } = req.query;
    const where = {};
    if (categoria) where.categoria = categoria;
    if (estrategia_logistica) where.estrategia_logistica = estrategia_logistica;
    if (busqueda) where.nombre = { [Op.like]: `%${busqueda}%` };

    const productos = await Producto.findAll({
      where,
      include: [{ model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'] }],
      order: [['nombre', 'ASC']],
    });

    // El "estado" de inventario (Normal / Stock bajo) se deriva aquí mismo,
    // así el front no tiene que repetir esta regla de negocio.
    const conEstado = productos.map(p => {
      const json = p.toJSON();
      json.estado_inventario = json.stock_actual <= json.stock_minimo ? 'Stock bajo' : 'Normal';
      return json;
    });

    return res.json(conEstado);
  } catch (err) {
    return res.status(500).json({ error: 'Error al listar productos', detalle: err.message });
  }
}

// GET /productos/:id
async function obtenerProducto(req, res) {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [{ model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'] }],
    });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    return res.json(producto);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener producto', detalle: err.message });
  }
}

// PUT /productos/:id
async function actualizarProducto(req, res) {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    const { nombre, descripcion, categoria, imagen_url, stock_minimo, costo_unitario, proveedor_id } = req.body;
    // stock_actual NO se edita aquí a propósito: solo cambia a través de
    // /movimientos, para que el historial de inventario sea siempre la
    // fuente de verdad y nunca quede desincronizado con el stock mostrado.
    await producto.update({
      nombre: nombre ?? producto.nombre,
      descripcion: descripcion ?? producto.descripcion,
      categoria: categoria ?? producto.categoria,
      imagen_url: imagen_url ?? producto.imagen_url,
      stock_minimo: stock_minimo ?? producto.stock_minimo,
      costo_unitario: costo_unitario ?? producto.costo_unitario,
      proveedor_id: proveedor_id ?? producto.proveedor_id,
    });

    return res.json(producto);
  } catch (err) {
    if (err.name === 'SequelizeValidationError') return res.status(400).json({ error: err.errors.map(e => e.message) });
    return res.status(500).json({ error: 'Error al actualizar producto', detalle: err.message });
  }
}

// DELETE /productos/:id
async function eliminarProducto(req, res) {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    await producto.destroy();
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Error al eliminar producto', detalle: err.message });
  }
}

// PUT /productos/:id/estrategia — pantalla 9 "Configurar estrategia"
async function actualizarEstrategia(req, res) {
  try {
    const { estrategia_logistica } = req.body;
    if (!['PUSH', 'PULL'].includes(estrategia_logistica)) {
      return res.status(400).json({ error: 'estrategia_logistica debe ser PUSH o PULL' });
    }
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    producto.estrategia_logistica = estrategia_logistica;
    await producto.save();
    return res.json(producto);
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar la estrategia', detalle: err.message });
  }
}

module.exports = { crearProducto, listarProductos, obtenerProducto, actualizarProducto, eliminarProducto, actualizarEstrategia };
