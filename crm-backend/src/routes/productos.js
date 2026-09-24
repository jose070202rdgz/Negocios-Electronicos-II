const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { crearProducto, listarProductos, obtenerProducto, actualizarProducto, eliminarProducto, actualizarEstrategia } = require('../controllers/productoController');

router.use(verificarToken, verificarRol('admin'));

router.post('/', crearProducto);
router.get('/', listarProductos);
router.get('/:id', obtenerProducto);
router.put('/:id', actualizarProducto);
router.delete('/:id', eliminarProducto);
router.put('/:id/estrategia', actualizarEstrategia);

module.exports = router;
