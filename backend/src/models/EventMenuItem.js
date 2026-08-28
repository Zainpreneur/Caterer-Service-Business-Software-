const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const EventMenuItem = sequelize.define('EventMenuItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  menuItemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  priceAtBooking: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'event_menu_items',
  timestamps: true,
});

module.exports = EventMenuItem;
