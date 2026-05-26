const router = require('express').Router();
const { Cliente, Proveedor, Categoria, Empleado, sequelize } = require('../models');
const { authMiddleware, requireRol } = require('./auth');

// ============================================================
// CLIENTES
// ============================================================
router.get('/clientes', authMiddleware, async (req, res) => {
  try {
    // ORM: findAll (CRUD lectura)
    const clientes = await Cliente.findAll({ order: [['apellido', 'ASC'], ['nombre', 'ASC']] });
    res.json(clientes);
  } catch (err) { res.status(500).json({ error: 'Error al obtener clientes' }); }
});

router.post('/clientes', authMiddleware, requireRol('admin', 'gerente', 'cajero'), async (req, res) => {
  const { nombre, apellido, email, telefono } = req.body;
  if (!nombre || !apellido)
    return res.status(400).json({ error: 'nombre y apellido son requeridos' });
  const t = await sequelize.transaction();
  try {
    // ORM: create (CRUD creación)
    const cliente = await Cliente.create({ nombre, apellido, email, telefono }, { transaction: t });
    await t.commit();
    res.status(201).json(cliente);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: 'Error al crear cliente' });
  }
});

router.put('/clientes/:id', authMiddleware, requireRol('admin', 'gerente', 'cajero'), async (req, res) => {
  const { nombre, apellido, email, telefono } = req.body;
  const t = await sequelize.transaction();
  try {
    // ORM: update
    const [count] = await Cliente.update(
      { nombre, apellido, email, telefono },
      { where: { id_cliente: req.params.id }, transaction: t }
    );
    if (count === 0) { await t.rollback(); return res.status(404).json({ error: 'Cliente no encontrado' }); }
    await t.commit();
    const actualizado = await Cliente.findByPk(req.params.id);
    res.json(actualizado);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

router.delete('/clientes/:id', authMiddleware, requireRol('admin'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const count = await Cliente.destroy({ where: { id_cliente: req.params.id }, transaction: t });
    if (count === 0) { await t.rollback(); return res.status(404).json({ error: 'Cliente no encontrado' }); }
    await t.commit();
    res.json({ message: 'Cliente eliminado' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

// ============================================================
// PROVEEDORES
// ============================================================
router.get('/proveedores', authMiddleware, async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll({ order: [['nombre', 'ASC']] });
    res.json(proveedores);
  } catch (err) { res.status(500).json({ error: 'Error al obtener proveedores' }); }
});

router.post('/proveedores', authMiddleware, requireRol('admin', 'inventario'), async (req, res) => {
  const { nombre, telefono, email, direccion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre es requerido' });
  const t = await sequelize.transaction();
  try {
    const proveedor = await Proveedor.create({ nombre, telefono, email, direccion }, { transaction: t });
    await t.commit();
    res.status(201).json(proveedor);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
});

router.put('/proveedores/:id', authMiddleware, requireRol('admin', 'inventario'), async (req, res) => {
  const { nombre, telefono, email, direccion } = req.body;
  const t = await sequelize.transaction();
  try {
    const [count] = await Proveedor.update(
      { nombre, telefono, email, direccion },
      { where: { id_proveedor: req.params.id }, transaction: t }
    );
    if (count === 0) { await t.rollback(); return res.status(404).json({ error: 'Proveedor no encontrado' }); }
    await t.commit();
    const actualizado = await Proveedor.findByPk(req.params.id);
    res.json(actualizado);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
});

router.delete('/proveedores/:id', authMiddleware, requireRol('admin'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const count = await Proveedor.destroy({ where: { id_proveedor: req.params.id }, transaction: t });
    if (count === 0) { await t.rollback(); return res.status(404).json({ error: 'Proveedor no encontrado' }); }
    await t.commit();
    res.json({ message: 'Proveedor eliminado' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
});

// ============================================================
// CATEGORÍAS
// ============================================================
router.get('/categorias', authMiddleware, async (req, res) => {
  try {
    const categorias = await Categoria.findAll({ order: [['nombre', 'ASC']] });
    res.json(categorias);
  } catch (err) { res.status(500).json({ error: 'Error al obtener categorías' }); }
});

// ============================================================
// EMPLEADOS – solo admin puede gestionarlos
// ============================================================
router.get('/empleados', authMiddleware, requireRol('admin'), async (req, res) => {
  try {
    const empleados = await Empleado.findAll({
      attributes: { exclude: ['password_hash'] },
      order: [['apellido', 'ASC']],
    });
    res.json(empleados);
  } catch (err) { res.status(500).json({ error: 'Error al obtener empleados' }); }
});

router.post('/empleados', authMiddleware, requireRol('admin'), async (req, res) => {
  const bcrypt = require('bcrypt');
  const { nombre, apellido, email, rol, password } = req.body;
  if (!nombre || !apellido || !email || !rol || !password)
    return res.status(400).json({ error: 'Todos los campos son requeridos' });

  const t = await sequelize.transaction();
  try {
    const hash = await bcrypt.hash(password, 10);
    // Invoca SP crear_empleado
    const [result] = await sequelize.query(
      'SELECT * FROM crear_empleado($1,$2,$3,$4,$5)',
      { bind: [nombre, apellido, email, rol, hash], transaction: t }
    );
    const row = result[0];
    if (row.p_error) {
      await t.rollback();
      return res.status(400).json({ error: row.p_error });
    }
    await t.commit();
    const nuevo = await Empleado.findByPk(row.p_id_empleado, {
      attributes: { exclude: ['password_hash'] },
    });
    res.status(201).json(nuevo);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
