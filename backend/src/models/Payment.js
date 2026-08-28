const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  invoiceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  method: {
    type: DataTypes.ENUM('cash', 'card', 'bank_transfer', 'cheque', 'online', 'other'),
    defaultValue: 'cash',
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  reference: {
    type: DataTypes.STRING,
  },
  notes: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'payments',
  timestamps: true,
});

module.exports = Payment;
