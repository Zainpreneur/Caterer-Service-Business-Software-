const { Op } = require('sequelize');
const { Customer, Event } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const getCustomers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const where = search
    ? {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
          { company: { [Op.like]: `%${search}%` } },
        ],
      }
    : {};

  const customers = await Customer.findAll({ where, order: [['createdAt', 'DESC']] });
  res.json(customers);
});

const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByPk(req.params.id, {
    include: [{ model: Event, as: 'events' }],
  });
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  res.json(customer);
});

const createCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone, company, address, notes } = req.body;
  if (!name) return res.status(400).json({ message: 'Customer name is required' });
  const customer = await Customer.create({ name, email, phone, company, address, notes });
  res.status(201).json(customer);
});

const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByPk(req.params.id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  const { name, email, phone, company, address, notes } = req.body;
  await customer.update({ name, email, phone, company, address, notes });
  res.json(customer);
});

const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByPk(req.params.id);
  if (!customer) return res.status(404).json({ message: 'Customer not found' });

  const eventCount = await Event.count({ where: { customerId: customer.id } });
  if (eventCount > 0) {
    return res.status(400).json({ message: 'Cannot delete a customer with existing events' });
  }

  await customer.destroy();
  res.json({ message: 'Customer deleted' });
});

module.exports = { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer };
