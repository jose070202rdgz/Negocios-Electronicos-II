const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { crearInteraccion, listarMiActividad, listarTodas } = require('../controllers/interaccionController');

router.use(verificarToken);

// Registrar una interacción requiere elegir un cliente, y solo admin
// tiene acceso a la cartera de clientes.
router.post('/', verificarRol('admin'), crearInteraccion);

// Cualquier usuario autenticado puede ver SU PROPIA actividad
router.get('/mias', listarMiActividad);

// Solo admin ve todas las interacciones del sistema
router.get('/', verificarRol('admin'), listarTodas);

module.exports = router;
