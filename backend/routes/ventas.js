const router = require('express').Router();
const { Venta, Cliente, Empleado, DetalleVenta, Producto, sequelize } = require('../models');
const { authMiddleware, requireRol } = require('./auth');

// GET /api/ventas – admin, gerente, cajero y reportes
router.get('/', authMiddleware, requireRol('admin', 'gerente', 'cajero', 'reportes'), async (req, res) => {
  try {
    const ventas = await Venta.findAll({
      include: [
        { model: Cliente,  as: 'cliente',  attributes: ['nombre', 'apellido'] },
        { model: Empleado, as: 'empleado', attributes: ['nombre', 'apellido'] },
        { model: DetalleVenta, as: 'detalles', attributes: ['id_detalle'] },
      ],
      order: [['fecha', 'DESC']],
    });
    res.json(ventas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
});

// GET /api/ventas/:id
router.get('/:id', authMiddleware, requireRol('admin', 'gerente', 'cajero', 'reportes'), async (req, res) => {
  try {
    const venta = await Venta.findByPk(req.params.id, {
      include: [
        { model: Cliente,  as: 'cliente' },
        { model: Empleado, as: 'empleado' },
        {
          model: DetalleVenta, as: 'detalles',
          include: [{ model: Producto, as: 'producto', attributes: ['nombre'] }],
        },
      ],
    });
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
    res.json(venta);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener venta' });
  }
});

// POST /api/ventas – invoca SP registrar_venta con transacción explícita + ROLLBACK
router.post('/', authMiddleware, requireRol('admin', 'gerente', 'cajero'), async (req, res) => {
  const { id_cliente, items } = req.body;
  if (!id_cliente || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'id_cliente e items son requeridos' });

  const t = await sequelize.transaction();
  try {
    const [result] = await sequelize.query(
      'SELECT * FROM registrar_venta($1, $2, $3)',
      {
        bind: [id_cliente, req.user.id, JSON.stringify(items)],
        transaction: t,
      }
    );
    const row = result[0];
    if (row.p_error) {
      await t.rollback();
      return res.status(400).json({ error: row.p_error });
    }
    await t.commit();
    res.status(201).json({
      id_venta: row.p_id_venta,
      total:    row.p_total,
      message: 'Venta registrada exitosamente',
    });
  } catch (err) {
    await t.rollback();
    console.error('ROLLBACK ejecutado:', err.message);
    res.status(400).json({ error: err.message || 'Error al procesar la venta' });
  }
});

// POST /api/ventas/:id/anular – invoca SP anular_venta
// Solo admin y gerente
router.post('/:id/anular', authMiddleware, requireRol('admin', 'gerente'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const [result] = await sequelize.query(
      'SELECT * FROM anular_venta($1)',
      { bind: [req.params.id], transaction: t }
    );
    const row = result[0];
    if (row.p_error) {
      await t.rollback();
      return res.status(400).json({ error: row.p_error });
    }
    await t.commit();
    res.json({ message: 'Venta anulada exitosamente' });
  } catch (err) {
    await t.rollback();
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
