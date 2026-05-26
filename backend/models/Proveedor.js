const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Proveedor', {
    id_proveedor: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre:       { type: DataTypes.STRING(150), allowNull: false },
    telefono:     { type: DataTypes.STRING(20) },
    email:        { type: DataTypes.STRING(150) },
    direccion:    { type: DataTypes.TEXT },
  }, { tableName: 'proveedores', timestamps: false });
