const { Op } = require('sequelize');
const {
  Event,
  Customer,
  Invoice,
  Payment,
  InventoryItem,
  MenuItem,
  EventMenuItem,
} = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const getSummary = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const startOfMonthStr = startOfMonth.toISOString().slice(0, 10);

  const [
    totalCustomers,
    upcomingEvents,
    eventsThisMonth,
    invoices,
    inventoryItems,
    allMenuLines,
  ] = await Promise.all([
    Customer.count(),
    Event.findAll({
      where: { eventDate: { [Op.gte]: today }, status: { [Op.notIn]: ['cancelled'] } },
      include: [{ model: Customer, as: 'customer' }],
      order: [['eventDate', 'ASC']],
      limit: 5,
    }),
    Event.count({ where: { eventDate: { [Op.gte]: startOfMonthStr } } }),
    Invoice.findAll(),
    InventoryItem.findAll(),
    EventMenuItem.findAll({ include: [{ model: MenuItem, as: 'menuItem' }] }),
  ]);

  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0);
  const outstandingAmount = invoices.reduce(
    (sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.amountPaid)),
    0
  );
  const revenueThisMonth = invoices
    .filter((inv) => inv.issueDate >= startOfMonthStr)
    .reduce((sum, inv) => sum + Number(inv.amountPaid), 0);

  const lowStockItems = inventoryItems.filter(
    (i) => Number(i.quantityInStock) <= Number(i.reorderLevel)
  );

  const eventStatusCounts = await Event.findAll({
    attributes: ['status', [Event.sequelize.fn('COUNT', Event.sequelize.col('id')), 'count']],
    group: ['status'],
  });

  const menuItemPopularity = {};
  allMenuLines.forEach((line) => {
    if (!line.menuItem) return;
    const key = line.menuItem.name;
    menuItemPopularity[key] = (menuItemPopularity[key] || 0) + Number(line.quantity);
  });
  const topMenuItems = Object.entries(menuItemPopularity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, quantity]) => ({ name, quantity }));

  res.json({
    totalCustomers,
    eventsThisMonth,
    totalRevenue,
    revenueThisMonth,
    outstandingAmount,
    lowStockCount: lowStockItems.length,
    lowStockItems,
    upcomingEvents,
    eventStatusCounts: eventStatusCounts.map((r) => ({
      status: r.status,
      count: Number(r.get('count')),
    })),
    topMenuItems,
  });
});

module.exports = { getSummary };
