const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Cliente', {
    id_cliente: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre:     { type: DataTypes.STRING(100), allowNull: false },
    apellido:   { type: DataTypes.STRING(100), allowNull: false },
    email:      { type: DataTypes.STRING(150) },
    telefono:   { type: DataTypes.STRING(20) },
  }, { tableName: 'clientes', timestamps: false });
