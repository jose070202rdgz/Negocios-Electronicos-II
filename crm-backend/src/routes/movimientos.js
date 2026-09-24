const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { crearMovimiento, listarMovimientos } = require('../controllers/movimientoController');

router.use(verificarToken, verificarRol('admin'));

router.post('/', crearMovimiento);
router.get('/', listarMovimientos);

module.exports = router;
