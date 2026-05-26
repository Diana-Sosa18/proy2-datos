const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME     || 'tienda_db',
  process.env.DB_USER     || 'proy3',
  process.env.DB_PASSWORD || 'secret',
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: false,
  }
);

const Categoria  = require('./Categoria')(sequelize);
const Proveedor  = require('./Proveedor')(sequelize);
const Producto   = require('./Producto')(sequelize);
const Empleado   = require('./Empleado')(sequelize);
const Cliente    = require('./Cliente')(sequelize);
const Venta      = require('./Venta')(sequelize);
const DetalleVenta = require('./DetalleVenta')(sequelize);

// Asociaciones
Producto.belongsTo(Categoria,  { foreignKey: 'id_categoria', as: 'categoria' });
Producto.belongsTo(Proveedor,  { foreignKey: 'id_proveedor', as: 'proveedor' });
Categoria.hasMany(Producto,    { foreignKey: 'id_categoria' });
Proveedor.hasMany(Producto,    { foreignKey: 'id_proveedor' });

Venta.belongsTo(Cliente,   { foreignKey: 'id_cliente',  as: 'cliente' });
Venta.belongsTo(Empleado,  { foreignKey: 'id_empleado', as: 'empleado' });
Cliente.hasMany(Venta,     { foreignKey: 'id_cliente' });
Empleado.hasMany(Venta,    { foreignKey: 'id_empleado' });

Venta.hasMany(DetalleVenta,     { foreignKey: 'id_venta', as: 'detalles' });
DetalleVenta.belongsTo(Venta,   { foreignKey: 'id_venta' });
DetalleVenta.belongsTo(Producto,{ foreignKey: 'id_producto', as: 'producto' });
Producto.hasMany(DetalleVenta,  { foreignKey: 'id_producto' });

module.exports = { sequelize, Categoria, Proveedor, Producto, Empleado, Cliente, Venta, DetalleVenta };
