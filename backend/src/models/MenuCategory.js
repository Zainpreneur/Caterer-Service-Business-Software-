const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MenuCategory = sequelize.define('MenuCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'menu_categories',
  timestamps: true,
});

module.exports = MenuCategory;
