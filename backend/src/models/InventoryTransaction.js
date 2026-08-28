const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const InventoryTransaction = sequelize.define('InventoryTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  inventoryItemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('restock', 'usage', 'adjustment'),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  note: {
    type: DataTypes.STRING,
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'inventory_transactions',
  timestamps: true,
});

module.exports = InventoryTransaction;
