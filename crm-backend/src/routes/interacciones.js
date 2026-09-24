const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { crearInteraccion, listarMiActividad, listarTodas } = require('../controllers/interaccionController');

router.use(verificarToken);

router.post('/', verificarRol('admin'), crearInteraccion);

router.get('/mias', listarMiActividad);

router.get('/', verificarRol('admin'), listarTodas);

module.exports = router;
