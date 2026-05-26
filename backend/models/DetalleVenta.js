const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('DetalleVenta', {
    id_detalle:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_venta:        { type: DataTypes.INTEGER, allowNull: false },
    id_producto:     { type: DataTypes.INTEGER, allowNull: false },
    cantidad:        { type: DataTypes.INTEGER, allowNull: false },
    precio_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  }, { tableName: 'detalle_ventas', timestamps: false });
