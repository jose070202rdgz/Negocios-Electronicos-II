const express = require('express');
const router = express.Router();
const { registrar, login, miPerfil, listarUsuarios, actualizarEstadoUsuario, cambiarPassword } = require('../controllers/authController');
const { verificarToken, verificarRol } = require('../middleware/auth');

router.post('/register', registrar);
router.post('/login', login);
router.get('/me', verificarToken, miPerfil);
router.put('/password', verificarToken, cambiarPassword);
router.get('/usuarios', verificarToken, verificarRol('admin'), listarUsuarios);
router.put('/usuarios/:id/estado', verificarToken, verificarRol('admin'), actualizarEstadoUsuario);

module.exports = router;
