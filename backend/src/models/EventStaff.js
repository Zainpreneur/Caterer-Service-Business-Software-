const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const EventStaff = sequelize.define('EventStaff', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  staffId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assignedRole: {
    type: DataTypes.STRING,
  },
  hoursAssigned: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
}, {
  tableName: 'event_staff',
  timestamps: true,
});

module.exports = EventStaff;
