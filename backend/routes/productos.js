const router = require('express').Router();
const pool   = require('../db/pool');
const { authMiddleware } = require('./auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.id_producto, p.nombre, p.descripcion, p.precio, p.stock,
             c.nombre AS categoria, pr.nombre AS proveedor
      FROM   productos p
      JOIN   categorias  c  ON c.id_categoria  = p.id_categoria
      JOIN   proveedores pr ON pr.id_proveedor = p.id_proveedor
      ORDER  BY p.nombre
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

router.get('/bajo-stock', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.id_producto, p.nombre, p.stock, c.nombre AS categoria
      FROM   productos p
      JOIN   categorias c ON c.id_categoria = p.id_categoria
      WHERE  p.id_producto IN (
               SELECT id_producto FROM productos WHERE stock < 30
             )
      ORDER  BY p.stock ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos con bajo stock' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, c.nombre AS categoria, pr.nombre AS proveedor
       FROM productos p
       JOIN categorias  c  ON c.id_categoria  = p.id_categoria
       JOIN proveedores pr ON pr.id_proveedor = p.id_proveedor
       WHERE p.id_producto = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { nombre, descripcion, precio, stock, id_categoria, id_proveedor } = req.body;
  if (!nombre || precio == null || id_categoria == null || id_proveedor == null)
    return res.status(400).json({ error: 'nombre, precio, id_categoria e id_proveedor son requeridos' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO productos (nombre, descripcion, precio, stock, id_categoria, id_proveedor)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [nombre, descripcion, precio, stock ?? 0, id_categoria, id_proveedor]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { nombre, descripcion, precio, stock, id_categoria, id_proveedor } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE productos
       SET nombre=$1, descripcion=$2, precio=$3, stock=$4, id_categoria=$5, id_proveedor=$6
       WHERE id_producto=$7 RETURNING *`,
      [nombre, descripcion, precio, stock, id_categoria, id_proveedor, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM productos WHERE id_producto=$1', [req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

module.exports = router;
