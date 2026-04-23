const router = require('express').Router();
const pool   = require('../db/pool');
const { authMiddleware } = require('./auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM vista_resumen_ventas');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const venta = await pool.query(
      `SELECT v.*, c.nombre||' '||c.apellido AS cliente,
              e.nombre||' '||e.apellido AS empleado
       FROM ventas v
       JOIN clientes  c ON c.id_cliente  = v.id_cliente
       JOIN empleados e ON e.id_empleado = v.id_empleado
       WHERE v.id_venta = $1`,
      [req.params.id]
    );
    if (venta.rows.length === 0) return res.status(404).json({ error: 'Venta no encontrada' });

    const detalle = await pool.query(
      `SELECT dv.*, p.nombre AS producto
       FROM detalle_ventas dv
       JOIN productos p ON p.id_producto = dv.id_producto
       WHERE dv.id_venta = $1`,
      [req.params.id]
    );
    res.json({ ...venta.rows[0], detalle: detalle.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener venta' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { id_cliente, items } = req.body;

  if (!id_cliente || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'id_cliente e items son requeridos' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let total = 0;
    const productosVerificados = [];

    for (const item of items) {
      const { rows } = await client.query(
        'SELECT id_producto, nombre, precio, stock FROM productos WHERE id_producto = $1 FOR UPDATE',
        [item.id_producto]
      );
      if (rows.length === 0) throw new Error(`Producto ${item.id_producto} no existe`);
      const p = rows[0];
      if (p.stock < item.cantidad)
        throw new Error(`Stock insuficiente para "${p.nombre}": disponible ${p.stock}, solicitado ${item.cantidad}`);
      total += p.precio * item.cantidad;
      productosVerificados.push({ ...p, cantidad: item.cantidad });
    }

    const { rows: ventaRows } = await client.query(
      `INSERT INTO ventas (total, id_cliente, id_empleado)
       VALUES ($1, $2, $3) RETURNING id_venta`,
      [total, id_cliente, req.user.id]
    );
    const id_venta = ventaRows[0].id_venta;

    for (const p of productosVerificados) {
      await client.query(
        `INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [id_venta, p.id_producto, p.cantidad, p.precio]
      );
      await client.query(
        'UPDATE productos SET stock = stock - $1 WHERE id_producto = $2',
        [p.cantidad, p.id_producto]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ id_venta, total, message: 'Venta registrada exitosamente' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ROLLBACK ejecutado:', err.message);
    res.status(400).json({ error: err.message || 'Error al procesar la venta' });
  } finally {
    client.release();
  }
});

module.exports = router;
