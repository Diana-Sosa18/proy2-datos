const router = require('express').Router();
const pool   = require('../db/pool');
const { authMiddleware } = require('./auth');

router.get('/clientes', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clientes ORDER BY apellido, nombre');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Error al obtener clientes' }); }
});

router.post('/clientes', authMiddleware, async (req, res) => {
  const { nombre, apellido, email, telefono } = req.body;
  if (!nombre || !apellido)
    return res.status(400).json({ error: 'nombre y apellido son requeridos' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO clientes (nombre, apellido, email, telefono) VALUES ($1,$2,$3,$4) RETURNING *',
      [nombre, apellido, email, telefono]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Error al crear cliente' }); }
});

router.put('/clientes/:id', authMiddleware, async (req, res) => {
  const { nombre, apellido, email, telefono } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE clientes SET nombre=$1, apellido=$2, email=$3, telefono=$4 WHERE id_cliente=$5 RETURNING *',
      [nombre, apellido, email, telefono, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Error al actualizar cliente' }); }
});

router.delete('/clientes/:id', authMiddleware, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM clientes WHERE id_cliente=$1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ message: 'Cliente eliminado' });
  } catch (err) { res.status(500).json({ error: 'Error al eliminar cliente' }); }
});

router.get('/proveedores', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM proveedores ORDER BY nombre');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Error al obtener proveedores' }); }
});

router.post('/proveedores', authMiddleware, async (req, res) => {
  const { nombre, telefono, email, direccion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO proveedores (nombre, telefono, email, direccion) VALUES ($1,$2,$3,$4) RETURNING *',
      [nombre, telefono, email, direccion]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Error al crear proveedor' }); }
});

router.put('/proveedores/:id', authMiddleware, async (req, res) => {
  const { nombre, telefono, email, direccion } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE proveedores SET nombre=$1, telefono=$2, email=$3, direccion=$4 WHERE id_proveedor=$5 RETURNING *',
      [nombre, telefono, email, direccion, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Error al actualizar proveedor' }); }
});

router.delete('/proveedores/:id', authMiddleware, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM proveedores WHERE id_proveedor=$1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json({ message: 'Proveedor eliminado' });
  } catch (err) { res.status(500).json({ error: 'Error al eliminar proveedor' }); }
});

router.get('/categorias', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM categorias ORDER BY nombre');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Error al obtener categorías' }); }
});

module.exports = router;
