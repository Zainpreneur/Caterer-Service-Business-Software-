const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const InventoryItem = sequelize.define('InventoryItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  unit: {
    type: DataTypes.STRING,
    defaultValue: 'unit',
  },
  quantityInStock: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  reorderLevel: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  costPerUnit: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  supplier: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'inventory_items',
  timestamps: true,
});

module.exports = InventoryItem;
