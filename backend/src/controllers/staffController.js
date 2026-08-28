const { Staff, EventStaff, Event } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const getStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findAll({ order: [['name', 'ASC']] });
  res.json(staff);
});

const getStaffMember = asyncHandler(async (req, res) => {
  const staff = await Staff.findByPk(req.params.id, {
    include: [{ model: EventStaff, as: 'eventAssignments', include: [{ model: Event, as: 'event' }] }],
  });
  if (!staff) return res.status(404).json({ message: 'Staff member not found' });
  res.json(staff);
});

const createStaff = asyncHandler(async (req, res) => {
  const { name, email, phone, role, hourlyRate, isActive } = req.body;
  if (!name) return res.status(400).json({ message: 'Staff name is required' });
  const staff = await Staff.create({ name, email, phone, role, hourlyRate, isActive });
  res.status(201).json(staff);
});

const updateStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findByPk(req.params.id);
  if (!staff) return res.status(404).json({ message: 'Staff member not found' });
  const { name, email, phone, role, hourlyRate, isActive } = req.body;
  await staff.update({
    name: name ?? staff.name,
    email: email ?? staff.email,
    phone: phone ?? staff.phone,
    role: role ?? staff.role,
    hourlyRate: hourlyRate ?? staff.hourlyRate,
    isActive: isActive === undefined ? staff.isActive : !!isActive,
  });
  res.json(staff);
});

const deleteStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findByPk(req.params.id);
  if (!staff) return res.status(404).json({ message: 'Staff member not found' });
  await staff.destroy();
  res.json({ message: 'Staff member deleted' });
});

module.exports = { getStaff, getStaffMember, createStaff, updateStaff, deleteStaff };
