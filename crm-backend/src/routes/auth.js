const express = require('express');
const router = express.Router();
const { registrar, login, miPerfil } = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');

router.post('/register', registrar);
router.post('/login', login);
router.get('/me', verificarToken, miPerfil);

module.exports = router;
