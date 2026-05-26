const router = require('express').Router();
const { Op }  = require('sequelize');
const { Producto, Categoria, Proveedor, sequelize } = require('../models');
const { authMiddleware, requireRol } = require('./auth');

// GET /api/productos  – todos los roles autenticados
router.get('/', authMiddleware, async (req, res) => {
  try {
    // ORM: findAll con includes (CRUD #1)
    const productos = await Producto.findAll({
      include: [
        { model: Categoria, as: 'categoria', attributes: ['nombre'] },
        { model: Proveedor,  as: 'proveedor',  attributes: ['nombre'] },
      ],
      order: [['nombre', 'ASC']],
    });
    // Aplanar para mantener compatibilidad con el frontend
    const flat = productos.map(p => ({
      ...p.toJSON(),
      categoria: p.categoria?.nombre ?? '',
      proveedor: p.proveedor?.nombre  ?? '',
    }));
    res.json(flat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET /api/productos/bajo-stock
router.get('/bajo-stock', authMiddleware, async (req, res) => {
  try {
    const productos = await Producto.findAll({
      where: { stock: { [Op.lt]: 30 } },
      include: [{ model: Categoria, as: 'categoria', attributes: ['nombre'] }],
      order: [['stock', 'ASC']],
    });
    const flat = productos.map(p => ({ ...p.toJSON(), categoria: p.categoria?.nombre ?? '' }));
    res.json(flat);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos con bajo stock' });
  }
});

// GET /api/productos/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Proveedor,  as: 'proveedor' },
      ],
    });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// POST /api/productos – invoca stored procedure crear_producto
// Solo admin, gerente e inventario
router.post('/', authMiddleware, requireRol('admin', 'gerente', 'inventario'), async (req, res) => {
  const { nombre, descripcion, precio, stock, id_categoria, id_proveedor } = req.body;
  if (!nombre || precio == null || id_categoria == null || id_proveedor == null)
    return res.status(400).json({ error: 'nombre, precio, id_categoria e id_proveedor son requeridos' });

  const t = await sequelize.transaction();
  try {
    const [result] = await sequelize.query(
      'SELECT * FROM crear_producto($1,$2,$3,$4,$5,$6)',
      {
        bind: [nombre, descripcion ?? null, precio, stock ?? 0, id_categoria, id_proveedor],
        transaction: t,
      }
    );
    const row = result[0];
    if (row.p_error) {
      await t.rollback();
      return res.status(400).json({ error: row.p_error });
    }
    await t.commit();

    // ORM: findByPk para devolver el objeto completo (CRUD #2)
    const nuevo = await Producto.findByPk(row.p_id_producto, {
      include: [
        { model: Categoria, as: 'categoria', attributes: ['nombre'] },
        { model: Proveedor,  as: 'proveedor',  attributes: ['nombre'] },
      ],
    });
    res.status(201).json(nuevo);
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// PUT /api/productos/:id – ORM update directo (CRUD #3)
// Solo admin, gerente e inventario
router.put('/:id', authMiddleware, requireRol('admin', 'gerente', 'inventario'), async (req, res) => {
  const { nombre, descripcion, precio, stock, id_categoria, id_proveedor } = req.body;
  const t = await sequelize.transaction();
  try {
    const [count] = await Producto.update(
      { nombre, descripcion, precio, stock, id_categoria, id_proveedor },
      { where: { id_producto: req.params.id }, transaction: t }
    );
    if (count === 0) {
      await t.rollback();
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    await t.commit();
    const actualizado = await Producto.findByPk(req.params.id, {
      include: [
        { model: Categoria, as: 'categoria', attributes: ['nombre'] },
        { model: Proveedor,  as: 'proveedor',  attributes: ['nombre'] },
      ],
    });
    res.json(actualizado);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// DELETE /api/productos/:id – solo admin
router.delete('/:id', authMiddleware, requireRol('admin'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const count = await Producto.destroy({ where: { id_producto: req.params.id }, transaction: t });
    if (count === 0) {
      await t.rollback();
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    await t.commit();
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// PATCH /api/productos/:id/stock – invoca SP actualizar_stock
router.patch('/:id/stock', authMiddleware, requireRol('admin', 'gerente', 'inventario'), async (req, res) => {
  const { delta } = req.body;
  if (delta == null) return res.status(400).json({ error: 'delta es requerido' });

  const t = await sequelize.transaction();
  try {
    const [result] = await sequelize.query(
      'SELECT * FROM actualizar_stock($1, $2)',
      { bind: [req.params.id, delta], transaction: t }
    );
    const row = result[0];
    if (row.p_error) {
      await t.rollback();
      return res.status(400).json({ error: row.p_error });
    }
    await t.commit();
    res.json({ stock_nuevo: row.p_stock_nuevo });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
