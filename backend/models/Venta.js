const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Venta', {
    id_venta:    { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fecha:       { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    total:       { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    estado:      { type: DataTypes.STRING(30), defaultValue: 'completada' },
    id_cliente:  { type: DataTypes.INTEGER, allowNull: false },
    id_empleado: { type: DataTypes.INTEGER, allowNull: false },
  }, { tableName: 'ventas', timestamps: false });
