const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Producto', {
    id_producto:  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre:       { type: DataTypes.STRING(150), allowNull: false },
    descripcion:  { type: DataTypes.TEXT },
    precio:       { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    stock:        { type: DataTypes.INTEGER, defaultValue: 0 },
    id_categoria: { type: DataTypes.INTEGER, allowNull: false },
    id_proveedor: { type: DataTypes.INTEGER, allowNull: false },
  }, { tableName: 'productos', timestamps: false });
