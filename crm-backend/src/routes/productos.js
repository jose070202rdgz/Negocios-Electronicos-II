const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { listarProductos, crearProducto, actualizarProducto, eliminarProducto } = require('../controllers/productoController');

router.use(verificarToken);
router.get('/', listarProductos);
router.post('/', verificarRol('admin'), crearProducto);
router.put('/:id', verificarRol('admin'), actualizarProducto);
router.delete('/:id', verificarRol('admin'), eliminarProducto);

module.exports = router;