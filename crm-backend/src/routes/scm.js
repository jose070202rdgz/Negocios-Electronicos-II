const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { obtenerMetricasScm } = require('../controllers/scmMetricaController');
const { obtenerMadurez, actualizarMadurez } = require('../controllers/madurezController');

router.use(verificarToken, verificarRol('admin'));

router.get('/metricas', obtenerMetricasScm);
router.get('/madurez', obtenerMadurez);
router.put('/madurez', actualizarMadurez);

module.exports = router;
