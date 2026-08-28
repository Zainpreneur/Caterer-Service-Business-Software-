const { sequelize, Invoice, Payment, Event, Customer, EventMenuItem, MenuItem } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const invoiceIncludes = [
  { model: Event, as: 'event', include: [{ model: Customer, as: 'customer' }] },
  { model: Payment, as: 'payments' },
];

async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const count = await Invoice.count();
  return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
}

function computeStatus(invoice) {
  const total = Number(invoice.totalAmount);
  const paid = Number(invoice.amountPaid);
  if (invoice.status === 'cancelled') return 'cancelled';
  if (paid <= 0) {
    if (invoice.dueDate && new Date(invoice.dueDate) < new Date()) return 'overdue';
    return invoice.status === 'draft' ? 'draft' : 'sent';
  }
  if (paid >= total) return 'paid';
  return 'partially_paid';
}

const getInvoices = asyncHandler(async (req, res) => {
  const { status, eventId } = req.query;
  const where = {};
  if (status) where.status = status;
  if (eventId) where.eventId = eventId;

  const invoices = await Invoice.findAll({ where, include: invoiceIncludes, order: [['issueDate', 'DESC']] });
  res.json(invoices);
});

const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findByPk(req.params.id, { include: invoiceIncludes });
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  res.json(invoice);
});

// Generate an invoice from an event's current menu selections/totals
const createInvoiceFromEvent = asyncHandler(async (req, res) => {
  const { eventId, dueDate, notes } = req.body;
  if (!eventId) return res.status(400).json({ message: 'eventId is required' });

  const event = await Event.findByPk(eventId, {
    include: [{ model: EventMenuItem, as: 'menuLines', include: [{ model: MenuItem, as: 'menuItem' }] }],
  });
  if (!event) return res.status(404).json({ message: 'Event not found' });

  const subtotal = (event.menuLines || []).reduce(
    (sum, line) => sum + Number(line.priceAtBooking) * Number(line.quantity) * Number(event.guestCount || 1),
    0
  );
  const discount = Number(event.discount || 0);
  const taxPercent = Number(event.taxPercent || 0);
  const afterDiscount = Math.max(subtotal - discount, 0);
  const tax = (afterDiscount * taxPercent) / 100;
  const totalAmount = afterDiscount + tax;

  const invoiceNumber = await generateInvoiceNumber();

  const invoice = await Invoice.create({
    eventId: event.id,
    invoiceNumber,
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: dueDate || null,
    subtotal,
    discount,
    tax,
    totalAmount,
    amountPaid: 0,
    status: 'sent',
    notes,
  });

  const created = await Invoice.findByPk(invoice.id, { include: invoiceIncludes });
  res.status(201).json(created);
});

const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findByPk(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

  const { dueDate, notes, status, discount, tax } = req.body;
  await invoice.update({
    dueDate: dueDate ?? invoice.dueDate,
    notes: notes ?? invoice.notes,
    status: status ?? invoice.status,
    discount: discount ?? invoice.discount,
    tax: tax ?? invoice.tax,
  });
  res.json(invoice);
});

const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findByPk(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  await invoice.destroy();
  res.json({ message: 'Invoice deleted' });
});

// ---- Payments ----
const addPayment = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findByPk(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

  const { amount, method, paymentDate, reference, notes } = req.body;
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ message: 'A positive payment amount is required' });
  }

  const result = await sequelize.transaction(async (t) => {
    const payment = await Payment.create(
      {
        invoiceId: invoice.id,
        amount,
        method,
        paymentDate: paymentDate || new Date().toISOString().slice(0, 10),
        reference,
        notes,
      },
      { transaction: t }
    );

    const newAmountPaid = Number(invoice.amountPaid) + Number(amount);
    await invoice.update(
      { amountPaid: newAmountPaid, status: computeStatus({ ...invoice.toJSON(), amountPaid: newAmountPaid }) },
      { transaction: t }
    );

    return payment;
  });

  const updatedInvoice = await Invoice.findByPk(invoice.id, { include: invoiceIncludes });
  res.status(201).json({ payment: result, invoice: updatedInvoice });
});

const deletePayment = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findByPk(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

  const payment = await Payment.findOne({ where: { id: req.params.paymentId, invoiceId: invoice.id } });
  if (!payment) return res.status(404).json({ message: 'Payment not found' });

  await sequelize.transaction(async (t) => {
    await payment.destroy({ transaction: t });
    const newAmountPaid = Math.max(Number(invoice.amountPaid) - Number(payment.amount), 0);
    await invoice.update(
      { amountPaid: newAmountPaid, status: computeStatus({ ...invoice.toJSON(), amountPaid: newAmountPaid }) },
      { transaction: t }
    );
  });

  res.json({ message: 'Payment removed' });
});

module.exports = {
  getInvoices,
  getInvoice,
  createInvoiceFromEvent,
  updateInvoice,
  deleteInvoice,
  addPayment,
  deletePayment,
};
