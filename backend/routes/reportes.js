const router = require('express').Router();
const pool   = require('../db/pool');
const { sequelize } = require('../models');
const { authMiddleware, requireRol } = require('./auth');

// Solo admin, gerente y reportes pueden ver reportes
const soloReportes = requireRol('admin', 'gerente', 'reportes');

router.get('/ventas-por-categoria', authMiddleware, soloReportes, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.nombre                    AS categoria,
             COUNT(DISTINCT v.id_venta)  AS total_ventas,
             SUM(dv.subtotal)            AS ingresos,
             AVG(dv.subtotal)            AS promedio_por_item,
             SUM(dv.cantidad)            AS unidades_vendidas
      FROM   categorias c
      JOIN   productos p   ON p.id_categoria = c.id_categoria
      JOIN   detalle_ventas dv ON dv.id_producto = p.id_producto
      JOIN   ventas v      ON v.id_venta = dv.id_venta
      GROUP  BY c.id_categoria, c.nombre
      HAVING SUM(dv.subtotal) > 0
      ORDER  BY ingresos DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error en reporte por categoría' });
  }
});

router.get('/top-productos', authMiddleware, soloReportes, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      WITH ventas_por_producto AS (
        SELECT dv.id_producto,
               SUM(dv.cantidad)   AS total_unidades,
               SUM(dv.subtotal)   AS total_ingresos,
               COUNT(dv.id_venta) AS num_ventas
        FROM   detalle_ventas dv
        JOIN   ventas v ON v.id_venta = dv.id_venta
        GROUP  BY dv.id_producto
      )
      SELECT p.nombre        AS producto,
             c.nombre        AS categoria,
             vp.total_unidades,
             vp.total_ingresos,
             vp.num_ventas,
             p.stock         AS stock_actual
      FROM   ventas_por_producto vp
      JOIN   productos  p ON p.id_producto  = vp.id_producto
      JOIN   categorias c ON c.id_categoria = p.id_categoria
      ORDER  BY vp.total_unidades DESC
      LIMIT  10
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error en reporte top productos' });
  }
});

router.get('/clientes-activos', authMiddleware, soloReportes, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.id_cliente,
             c.nombre || ' ' || c.apellido AS cliente,
             c.email,
             COUNT(v.id_venta)             AS total_compras,
             SUM(v.total)                  AS total_gastado
      FROM   clientes c
      JOIN   ventas v ON v.id_cliente = c.id_cliente
      WHERE  EXISTS (
               SELECT 1 FROM ventas
               WHERE id_cliente = c.id_cliente
                 AND fecha >= NOW() - INTERVAL '90 days'
             )
      GROUP  BY c.id_cliente, c.nombre, c.apellido, c.email
      ORDER  BY total_gastado DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error en reporte clientes activos' });
  }
});

router.get('/ventas-por-empleado', authMiddleware, soloReportes, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT e.nombre || ' ' || e.apellido AS empleado,
             e.rol,
             COUNT(v.id_venta)             AS total_ventas,
             SUM(v.total)                  AS total_facturado,
             AVG(v.total)                  AS promedio_venta
      FROM   empleados e
      JOIN   ventas v ON v.id_empleado = e.id_empleado
      GROUP  BY e.id_empleado, e.nombre, e.apellido, e.rol
      ORDER  BY total_facturado DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error en reporte por empleado' });
  }
});

// GET /api/reportes/ventas-periodo – invoca SP reporte_ventas_periodo
router.get('/ventas-periodo', authMiddleware, soloReportes, async (req, res) => {
  const { desde, hasta } = req.query;
  if (!desde || !hasta)
    return res.status(400).json({ error: 'Parámetros desde y hasta son requeridos' });
  try {
    const [rows] = await sequelize.query(
      'SELECT * FROM reporte_ventas_periodo($1, $2)',
      { bind: [desde, hasta] }
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error en reporte de ventas por período' });
  }
});

module.exports = router;
