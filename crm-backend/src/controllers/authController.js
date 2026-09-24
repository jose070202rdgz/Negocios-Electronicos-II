const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
require('dotenv').config();

async function registrar(req, res) {
  try {
    const { nombre, correo, password, rol } = req.body;
    if (!nombre || !correo || !password) {
      return res.status(400).json({ error: 'nombre, correo y password son obligatorios' });
    }
    const existente = await Usuario.findOne({ where: { correo } });
    if (existente) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese correo' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const usuario = await Usuario.create({
      nombre, correo, password_hash,
      rol: rol === 'admin' ? 'admin' : 'usuario',
    });
    return res.status(201).json({ id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol });
  } catch (err) {
    return res.status(500).json({ error: 'Error al registrar usuario', detalle: err.message });
  }
}

async function login(req, res) {
  try {
    const { correo, password } = req.body;
    if (!correo || !password) {
      return res.status(400).json({ error: 'correo y password son obligatorios' });
    }
    const usuario = await Usuario.findOne({ where: { correo } });
    if (!usuario) return res.status(401).json({ error: 'Credenciales inválidas' });
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) return res.status(401).json({ error: 'Credenciales inválidas' });
    if (usuario.estado === 'inactivo') return res.status(403).json({ error: 'Cuenta deshabilitada. Contacta al administrador.' });
    const token = jwt.sign(
      { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
    return res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol, estado: usuario.estado } });
  } catch (err) {
    return res.status(500).json({ error: 'Error al iniciar sesión', detalle: err.message });
  }
}

async function miPerfil(req, res) {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: ['id', 'nombre', 'correo', 'rol', 'createdAt'],
    });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.json(usuario);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener el perfil', detalle: err.message });
  }
}

// GET /auth/usuarios — solo admin
async function listarUsuarios(req, res) {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ['id', 'nombre', 'correo', 'rol', 'estado', 'createdAt'],
      order: [['createdAt', 'ASC']],
    });
    return res.json(usuarios);
  } catch (err) {
    return res.status(500).json({ error: 'Error al listar usuarios', detalle: err.message });
  }
}

// PUT /auth/usuarios/:id/estado — activar/desactivar (solo admin, no puede desactivarse a sí mismo)
async function actualizarEstadoUsuario(req, res) {
  try {
    const { estado } = req.body;
    if (!['activo', 'inactivo'].includes(estado)) {
      return res.status(400).json({ error: 'estado debe ser "activo" o "inactivo"' });
    }
    if (Number(req.params.id) === req.usuario.id) {
      return res.status(400).json({ error: 'No puedes cambiar el estado de tu propia cuenta' });
    }
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    usuario.estado = estado;
    await usuario.save();
    return res.json({ id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol, estado: usuario.estado });
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar el estado', detalle: err.message });
  }
}

// PUT /auth/password — cambiar mi propia contraseña
async function cambiarPassword(req, res) {
  try {
    const { passwordActual, passwordNueva } = req.body;
    if (!passwordActual || !passwordNueva) {
      return res.status(400).json({ error: 'passwordActual y passwordNueva son obligatorios' });
    }
    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    const valido = await bcrypt.compare(passwordActual, usuario.password_hash);
    if (!valido) return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    usuario.password_hash = await bcrypt.hash(passwordNueva, 10);
    await usuario.save();
    return res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al cambiar la contraseña', detalle: err.message });
  }
}

module.exports = { registrar, login, miPerfil, listarUsuarios, actualizarEstadoUsuario, cambiarPassword };
