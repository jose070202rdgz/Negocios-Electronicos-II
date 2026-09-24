const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middleware/auth');
const { crearProveedor, listarProveedores, obtenerProveedor, actualizarProveedor, eliminarProveedor } = require('../controllers/proveedorController');

router.use(verificarToken, verificarRol('admin'));

router.post('/', crearProveedor);
router.get('/', listarProveedores);
router.get('/:id', obtenerProveedor);
router.put('/:id', actualizarProveedor);
router.delete('/:id', eliminarProveedor);

module.exports = router;
