const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const clienteRoutes = require('./routes/clientes');
const interaccionRoutes = require('./routes/interacciones');
const metricaRoutes = require('./routes/metricas');
const productoRoutes = require('./routes/productos');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensaje: 'API del CRM funcionando correctamente' });
});

app.use('/auth', authRoutes);
app.use('/clientes', clienteRoutes);
app.use('/interacciones', interaccionRoutes);
app.use('/metricas', metricaRoutes);
app.use('/productos', productoRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;
