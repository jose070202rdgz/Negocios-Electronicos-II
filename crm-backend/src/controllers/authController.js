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
      nombre,
      correo,
      password_hash,
      rol: rol === 'admin' ? 'admin' : 'usuario',
    });

    return res.status(201).json({
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    });
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
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error al iniciar sesión', detalle: err.message });
  }
}

async function miPerfil(req, res) {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: ['id', 'nombre', 'correo', 'rol', 'createdAt'],
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json(usuario);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener el perfil', detalle: err.message });
  }
}

module.exports = { registrar, login, miPerfil };
