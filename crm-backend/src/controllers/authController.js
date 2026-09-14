const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
require('dotenv').config();

async function registrar(req, res) {
  try {
    const { nombre, apellido_paterno, apellido_materno, correo, telefono, password, rol } = req.body;
    const nombreValido = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '’-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
    const passwordValido = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!nombre || !apellido_paterno || !apellido_materno || !correo || !telefono || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    if (![nombre, apellido_paterno, apellido_materno].every((campo) => nombreValido.test(campo.trim()))) {
      return res.status(400).json({ error: 'Los nombres y apellidos solo pueden contener letras' });
    }
    if (!/^\d{10}$/.test(telefono)) {
      return res.status(400).json({ error: 'El teléfono debe contener exactamente 10 dígitos' });
    }
    if (!passwordValido.test(password)) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial' });
    }

    const existente = await Usuario.findOne({ where: { correo } });
    if (existente) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese correo' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const usuario = await Usuario.create({
      nombre: nombre.trim(),
      apellido_paterno: apellido_paterno.trim(),
      apellido_materno: apellido_materno.trim(),
      correo,
      telefono,
      password_hash,
      rol: rol === 'admin' ? 'admin' : 'usuario',
    });

    return res.status(201).json({
      id: usuario.id,
      nombre: usuario.nombre,
      apellido_paterno: usuario.apellido_paterno,
      apellido_materno: usuario.apellido_materno,
      telefono: usuario.telefono,
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
      usuario: { id: usuario.id, nombre: usuario.nombre, apellido_paterno: usuario.apellido_paterno, apellido_materno: usuario.apellido_materno, telefono: usuario.telefono, correo: usuario.correo, rol: usuario.rol },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error al iniciar sesión', detalle: err.message });
  }
}

async function miPerfil(req, res) {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'telefono', 'correo', 'rol', 'createdAt'],
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json(usuario);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener el perfil', detalle: err.message });
  }
}

async function actualizarPerfil(req, res) {
  try {
    const { nombre, correo } = req.body;
    if (!nombre?.trim() || !correo?.trim()) {
      return res.status(400).json({ error: 'El nombre y el correo son obligatorios' });
    }

    const existente = await Usuario.findOne({ where: { correo: correo.trim() } });
    if (existente && existente.id !== req.usuario.id) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese correo' });
    }

    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    await usuario.update({ nombre: nombre.trim(), correo: correo.trim() });
    return res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      apellido_paterno: usuario.apellido_paterno,
      apellido_materno: usuario.apellido_materno,
      telefono: usuario.telefono,
      correo: usuario.correo,
      rol: usuario.rol,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar el perfil', detalle: err.message });
  }
}

async function actualizarPassword(req, res) {
  try {
    const { passwordActual, passwordNueva } = req.body;
    const passwordValido = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordActual || !passwordNueva) {
      return res.status(400).json({ error: 'La contraseña actual y la nueva son obligatorias' });
    }
    if (!passwordValido.test(passwordNueva)) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial' });
    }

    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (!(await bcrypt.compare(passwordActual, usuario.password_hash))) {
      return res.status(401).json({ error: 'La contraseña actual no es correcta' });
    }

    await usuario.update({ password_hash: await bcrypt.hash(passwordNueva, 10) });
    return res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar la contraseña', detalle: err.message });
  }
}

async function listarUsuarios(req, res) {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'correo', 'rol', 'createdAt'],
      order: [['createdAt', 'ASC']],
    });

    return res.json(usuarios);
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener los usuarios', detalle: err.message });
  }
}

module.exports = { registrar, login, miPerfil, actualizarPerfil, actualizarPassword, listarUsuarios };
