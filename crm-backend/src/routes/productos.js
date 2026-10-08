const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { crearProducto, listarProductos, obtenerProducto, actualizarProducto, eliminarProducto, actualizarEstrategia } = require('../controllers/productoController');

router.use(verificarToken);

router.get('/', listarProductos);
router.get('/:id', obtenerProducto);

router.use(verificarRol('admin'));

router.post('/', crearProducto);
router.put('/:id', actualizarProducto);
router.delete('/:id', eliminarProducto);
router.put('/:id/estrategia', actualizarEstrategia);

module.exports = router;
