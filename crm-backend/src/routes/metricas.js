const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { obtenerMetricas } = require('../controllers/metricaController');

router.use(verificarToken, verificarRol('admin'));

router.get('/', obtenerMetricas);

module.exports = router;
