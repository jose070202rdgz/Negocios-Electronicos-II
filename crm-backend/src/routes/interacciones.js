const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { crearInteraccion, listarTodasLasInteracciones } = require('../controllers/interaccionController');

router.use(verificarToken);

router.post('/', verificarRol('admin'), crearInteraccion);

router.get('/', listarTodasLasInteracciones);

module.exports = router;
