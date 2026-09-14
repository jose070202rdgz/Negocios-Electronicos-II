const express = require('express');
const router = express.Router();
const { registrar, login, miPerfil, actualizarPerfil, actualizarPassword, listarUsuarios } = require('../controllers/authController');
const { verificarToken, verificarRol } = require('../middleware/auth');

router.post('/register', registrar);
router.post('/login', login);
router.get('/me', verificarToken, miPerfil);
router.put('/me', verificarToken, actualizarPerfil);
router.put('/password', verificarToken, actualizarPassword);
router.get('/users', verificarToken, verificarRol('admin'), listarUsuarios);

module.exports = router;
