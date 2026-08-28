const sequelize = require('../config/db');

const User = require('./User');
const Customer = require('./Customer');
const MenuCategory = require('./MenuCategory');
const MenuItem = require('./MenuItem');
const Event = require('./Event');
const EventMenuItem = require('./EventMenuItem');
const Staff = require('./Staff');
const EventStaff = require('./EventStaff');
const InventoryItem = require('./InventoryItem');
const InventoryTransaction = require('./InventoryTransaction');
const Invoice = require('./Invoice');
const Payment = require('./Payment');

// Customer <-> Event
Customer.hasMany(Event, { foreignKey: 'customerId', as: 'events', onDelete: 'RESTRICT' });
Event.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// MenuCategory <-> MenuItem
MenuCategory.hasMany(MenuItem, { foreignKey: 'categoryId', as: 'items', onDelete: 'SET NULL' });
MenuItem.belongsTo(MenuCategory, { foreignKey: 'categoryId', as: 'category' });

// Event <-> MenuItem (through EventMenuItem)
Event.hasMany(EventMenuItem, { foreignKey: 'eventId', as: 'menuLines', onDelete: 'CASCADE' });
EventMenuItem.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });
MenuItem.hasMany(EventMenuItem, { foreignKey: 'menuItemId', as: 'eventLines' });
EventMenuItem.belongsTo(MenuItem, { foreignKey: 'menuItemId', as: 'menuItem' });

// Event <-> Staff (through EventStaff)
Event.hasMany(EventStaff, { foreignKey: 'eventId', as: 'staffAssignments', onDelete: 'CASCADE' });
EventStaff.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });
Staff.hasMany(EventStaff, { foreignKey: 'staffId', as: 'eventAssignments' });
EventStaff.belongsTo(Staff, { foreignKey: 'staffId', as: 'staff' });

// InventoryItem <-> InventoryTransaction
InventoryItem.hasMany(InventoryTransaction, { foreignKey: 'inventoryItemId', as: 'transactions', onDelete: 'CASCADE' });
InventoryTransaction.belongsTo(InventoryItem, { foreignKey: 'inventoryItemId', as: 'item' });
Event.hasMany(InventoryTransaction, { foreignKey: 'eventId', as: 'inventoryTransactions' });
InventoryTransaction.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

// Event <-> Invoice
Event.hasMany(Invoice, { foreignKey: 'eventId', as: 'invoices', onDelete: 'CASCADE' });
Invoice.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

// Invoice <-> Payment
Invoice.hasMany(Payment, { foreignKey: 'invoiceId', as: 'payments', onDelete: 'CASCADE' });
Payment.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

module.exports = {
  sequelize,
  User,
  Customer,
  MenuCategory,
  MenuItem,
  Event,
  EventMenuItem,
  Staff,
  EventStaff,
  InventoryItem,
  InventoryTransaction,
  Invoice,
  Payment,
};
