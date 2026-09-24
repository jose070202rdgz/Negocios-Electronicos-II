const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const clienteRoutes = require('./routes/clientes');
const interaccionRoutes = require('./routes/interacciones');
const metricaRoutes = require('./routes/metricas');

const proveedorRoutes = require('./routes/proveedores');
const productoRoutes = require('./routes/productos');
const movimientoRoutes = require('./routes/movimientos');
const pedidoRoutes = require('./routes/pedidos');
const scmRoutes = require('./routes/scm');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensaje: 'API del CRM + SCM funcionando correctamente' });
});

app.use('/auth', authRoutes);
app.use('/clientes', clienteRoutes);
app.use('/interacciones', interaccionRoutes);
app.use('/metricas', metricaRoutes);

app.use('/proveedores', proveedorRoutes);
app.use('/productos', productoRoutes);
app.use('/movimientos', movimientoRoutes);
app.use('/pedidos', pedidoRoutes);
app.use('/scm', scmRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;
