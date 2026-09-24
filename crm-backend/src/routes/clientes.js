const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { crearCliente, listarClientes, obtenerCliente, actualizarCliente, eliminarCliente, actualizarEtapa } = require('../controllers/clienteController');
const { listarInteraccionesPorCliente } = require('../controllers/interaccionController');

router.use(verificarToken, verificarRol('admin'));

router.post('/', crearCliente);
router.get('/', listarClientes);
router.get('/:id', obtenerCliente);
router.put('/:id', actualizarCliente);
router.put('/:id/etapa', actualizarEtapa);
router.delete('/:id', eliminarCliente);
router.get('/:id/interacciones', listarInteraccionesPorCliente);

module.exports = router;
