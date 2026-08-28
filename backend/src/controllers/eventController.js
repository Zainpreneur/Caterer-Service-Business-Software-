const { Op } = require('sequelize');
const {
  sequelize,
  Event,
  Customer,
  EventMenuItem,
  MenuItem,
  EventStaff,
  Staff,
  Invoice,
} = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const eventIncludes = [
  { model: Customer, as: 'customer' },
  { model: EventMenuItem, as: 'menuLines', include: [{ model: MenuItem, as: 'menuItem' }] },
  { model: EventStaff, as: 'staffAssignments', include: [{ model: Staff, as: 'staff' }] },
  { model: Invoice, as: 'invoices' },
];

function computeTotals(event) {
  const menuTotal = (event.menuLines || []).reduce(
    (sum, line) => sum + Number(line.priceAtBooking) * Number(line.quantity) * Number(event.guestCount || 1),
    0
  );
  const discount = Number(event.discount || 0);
  const taxPercent = Number(event.taxPercent || 0);
  const afterDiscount = Math.max(menuTotal - discount, 0);
  const tax = (afterDiscount * taxPercent) / 100;
  const total = afterDiscount + tax;
  return { subtotal: menuTotal, discount, tax, total };
}

const getEvents = asyncHandler(async (req, res) => {
  const { status, from, to, customerId } = req.query;
  const where = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (from || to) {
    where.eventDate = {};
    if (from) where.eventDate[Op.gte] = from;
    if (to) where.eventDate[Op.lte] = to;
  }

  const events = await Event.findAll({
    where,
    include: eventIncludes,
    order: [['eventDate', 'ASC']],
  });

  const withTotals = events.map((e) => {
    const plain = e.toJSON();
    plain.totals = computeTotals(plain);
    return plain;
  });

  res.json(withTotals);
});

const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByPk(req.params.id, { include: eventIncludes });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  const plain = event.toJSON();
  plain.totals = computeTotals(plain);
  res.json(plain);
});

const createEvent = asyncHandler(async (req, res) => {
  const {
    customerId,
    title,
    eventType,
    eventDate,
    startTime,
    endTime,
    venue,
    guestCount,
    notes,
    discount,
    taxPercent,
    menuItems, // [{ menuItemId, quantity }]
  } = req.body;

  if (!customerId || !title || !eventDate) {
    return res.status(400).json({ message: 'customerId, title and eventDate are required' });
  }

  const customer = await Customer.findByPk(customerId);
  if (!customer) return res.status(400).json({ message: 'Customer not found' });

  const result = await sequelize.transaction(async (t) => {
    const event = await Event.create(
      {
        customerId,
        title,
        eventType,
        eventDate,
        startTime,
        endTime,
        venue,
        guestCount: guestCount || 0,
        notes,
        discount: discount || 0,
        taxPercent: taxPercent || 0,
        createdBy: req.user ? req.user.id : null,
      },
      { transaction: t }
    );

    if (Array.isArray(menuItems) && menuItems.length > 0) {
      const menuItemIds = menuItems.map((mi) => mi.menuItemId);
      const dbMenuItems = await MenuItem.findAll({ where: { id: menuItemIds }, transaction: t });
      const priceMap = new Map(dbMenuItems.map((mi) => [mi.id, Number(mi.pricePerHead)]));

      const lines = menuItems
        .filter((mi) => priceMap.has(mi.menuItemId))
        .map((mi) => ({
          eventId: event.id,
          menuItemId: mi.menuItemId,
          quantity: mi.quantity || 1,
          priceAtBooking: priceMap.get(mi.menuItemId),
        }));

      if (lines.length > 0) {
        await EventMenuItem.bulkCreate(lines, { transaction: t });
      }
    }

    return event;
  });

  const created = await Event.findByPk(result.id, { include: eventIncludes });
  const plain = created.toJSON();
  plain.totals = computeTotals(plain);
  res.status(201).json(plain);
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByPk(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  const {
    title,
    eventType,
    eventDate,
    startTime,
    endTime,
    venue,
    guestCount,
    status,
    notes,
    discount,
    taxPercent,
    menuItems,
  } = req.body;

  await sequelize.transaction(async (t) => {
    await event.update(
      {
        title: title ?? event.title,
        eventType: eventType ?? event.eventType,
        eventDate: eventDate ?? event.eventDate,
        startTime: startTime ?? event.startTime,
        endTime: endTime ?? event.endTime,
        venue: venue ?? event.venue,
        guestCount: guestCount ?? event.guestCount,
        status: status ?? event.status,
        notes: notes ?? event.notes,
        discount: discount ?? event.discount,
        taxPercent: taxPercent ?? event.taxPercent,
      },
      { transaction: t }
    );

    if (Array.isArray(menuItems)) {
      await EventMenuItem.destroy({ where: { eventId: event.id }, transaction: t });
      if (menuItems.length > 0) {
        const menuItemIds = menuItems.map((mi) => mi.menuItemId);
        const dbMenuItems = await MenuItem.findAll({ where: { id: menuItemIds }, transaction: t });
        const priceMap = new Map(dbMenuItems.map((mi) => [mi.id, Number(mi.pricePerHead)]));

        const lines = menuItems
          .filter((mi) => priceMap.has(mi.menuItemId))
          .map((mi) => ({
            eventId: event.id,
            menuItemId: mi.menuItemId,
            quantity: mi.quantity || 1,
            priceAtBooking: priceMap.get(mi.menuItemId),
          }));

        if (lines.length > 0) {
          await EventMenuItem.bulkCreate(lines, { transaction: t });
        }
      }
    }
  });

  const updated = await Event.findByPk(event.id, { include: eventIncludes });
  const plain = updated.toJSON();
  plain.totals = computeTotals(plain);
  res.json(plain);
});

const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByPk(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  await event.destroy();
  res.json({ message: 'Event deleted' });
});

// ---- Staff assignment ----
const assignStaff = asyncHandler(async (req, res) => {
  const event = await Event.findByPk(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  const { staffId, assignedRole, hoursAssigned } = req.body;
  if (!staffId) return res.status(400).json({ message: 'staffId is required' });

  const staff = await Staff.findByPk(staffId);
  if (!staff) return res.status(400).json({ message: 'Staff not found' });

  const existing = await EventStaff.findOne({ where: { eventId: event.id, staffId } });
  if (existing) {
    await existing.update({ assignedRole, hoursAssigned });
    return res.json(existing);
  }

  const assignment = await EventStaff.create({
    eventId: event.id,
    staffId,
    assignedRole,
    hoursAssigned: hoursAssigned || 0,
  });
  res.status(201).json(assignment);
});

const removeStaffAssignment = asyncHandler(async (req, res) => {
  const assignment = await EventStaff.findOne({
    where: { eventId: req.params.id, staffId: req.params.staffId },
  });
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
  await assignment.destroy();
  res.json({ message: 'Staff removed from event' });
});

module.exports = {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  assignStaff,
  removeStaffAssignment,
};
