require('dotenv').config();
const app = require('./app');
const { sequelize, Producto } = require('./models');

const PORT = process.env.PORT || 4000;

async function iniciar() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida.');

    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados con la base de datos.');

    await Producto.update({ stock_minimo: 5 }, { where: {} });
    console.log('✅ Stock mínimo establecido en cinco unidades para todos los productos.');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor CRM + SCM corriendo en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ No se pudo iniciar el servidor:', err);
    process.exit(1);
  }
}

iniciar();
