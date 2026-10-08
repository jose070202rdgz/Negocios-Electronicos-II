const { sequelize, Producto, MovimientoInventario, Usuario } = require('../src/models');

async function ajustarStock() {
  const transaction = await sequelize.transaction();
  try {
    const usuario = await Usuario.findOne({
      where: { rol: 'admin' },
      order: [['id', 'ASC']],
      transaction,
    });
    if (!usuario) throw new Error('Se necesita al menos un usuario administrador para registrar los ajustes.');

    const productos = await Producto.findAll({
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    let ajustados = 0;
    for (const producto of productos) {
      const stockAnterior = Number(producto.stock_actual);
      const diferencia = 10 - stockAnterior;
      if (diferencia !== 0) {
        await MovimientoInventario.create({
          producto_id: producto.id,
          tipo: diferencia > 0 ? 'entrada' : 'salida',
          cantidad: Math.abs(diferencia),
          motivo: 'Ajuste general: stock establecido en 10',
          fecha: new Date(),
          usuario_id: usuario.id,
        }, { transaction });
        ajustados += 1;
      }
      producto.stock_actual = 10;
      producto.stock_minimo = 5;
      await producto.save({ transaction });
    }

    await transaction.commit();
    console.log(`Listo: ${productos.length} productos revisados; ${ajustados} ajustados a stock 10.`);
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    throw error;
  } finally {
    await sequelize.close();
  }
}

ajustarStock().catch(error => {
  console.error('No se pudo ajustar el inventario:', error.message);
  process.exitCode = 1;
});