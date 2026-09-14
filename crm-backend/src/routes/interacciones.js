const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { crearInteraccion, listarTodasLasInteracciones, listarMisInteracciones } = require('../controllers/interaccionController');

router.use(verificarToken);

router.post('/', verificarRol('admin'), crearInteraccion);

router.get('/mine', listarMisInteracciones);
router.get('/', listarTodasLasInteracciones);

module.exports = router;
