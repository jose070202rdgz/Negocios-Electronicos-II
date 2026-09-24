const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { crearPedido, listarPedidos, actualizarPedido, actualizarEstadoPedido, eliminarPedido } = require('../controllers/pedidoController');

router.use(verificarToken, verificarRol('admin'));

router.post('/', crearPedido);
router.get('/', listarPedidos);
router.put('/:id', actualizarPedido);
router.put('/:id/estado', actualizarEstadoPedido);
router.delete('/:id', eliminarPedido);

module.exports = router;
