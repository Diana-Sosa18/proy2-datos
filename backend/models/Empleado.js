const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Empleado', {
    id_empleado:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre:        { type: DataTypes.STRING(100), allowNull: false },
    apellido:      { type: DataTypes.STRING(100), allowNull: false },
    email:         { type: DataTypes.STRING(150), allowNull: false, unique: true },
    rol:           { type: DataTypes.STRING(50), defaultValue: 'cajero' },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
  }, { tableName: 'empleados', timestamps: false });
