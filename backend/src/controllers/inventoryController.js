const { sequelize, InventoryItem, InventoryTransaction } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const getInventoryItems = asyncHandler(async (req, res) => {
  const { lowStock } = req.query;
  const items = await InventoryItem.findAll({ order: [['name', 'ASC']] });
  const result = lowStock === 'true'
    ? items.filter((i) => Number(i.quantityInStock) <= Number(i.reorderLevel))
    : items;
  res.json(result);
});

const getInventoryItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findByPk(req.params.id, {
    include: [{ model: InventoryTransaction, as: 'transactions', order: [['createdAt', 'DESC']] }],
  });
  if (!item) return res.status(404).json({ message: 'Inventory item not found' });
  res.json(item);
});

const createInventoryItem = asyncHandler(async (req, res) => {
  const { name, unit, quantityInStock, reorderLevel, costPerUnit, supplier } = req.body;
  if (!name) return res.status(400).json({ message: 'Item name is required' });
  const item = await InventoryItem.create({ name, unit, quantityInStock, reorderLevel, costPerUnit, supplier });
  res.status(201).json(item);
});

const updateInventoryItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'Inventory item not found' });
  const { name, unit, reorderLevel, costPerUnit, supplier } = req.body;
  await item.update({
    name: name ?? item.name,
    unit: unit ?? item.unit,
    reorderLevel: reorderLevel ?? item.reorderLevel,
    costPerUnit: costPerUnit ?? item.costPerUnit,
    supplier: supplier ?? item.supplier,
  });
  res.json(item);
});

const deleteInventoryItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'Inventory item not found' });
  await item.destroy();
  res.json({ message: 'Inventory item deleted' });
});

// Record a stock transaction (restock adds, usage/adjustment subtract or set delta)
const createTransaction = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'Inventory item not found' });

  const { type, quantity, note, eventId } = req.body;
  if (!type || quantity === undefined) {
    return res.status(400).json({ message: 'type and quantity are required' });
  }

  const delta = type === 'restock' ? Number(quantity) : -Math.abs(Number(quantity));
  const newQuantity = Number(item.quantityInStock) + (type === 'adjustment' ? Number(quantity) : delta);

  if (newQuantity < 0) {
    return res.status(400).json({ message: 'Resulting stock quantity cannot be negative' });
  }

  const result = await sequelize.transaction(async (t) => {
    const tx = await InventoryTransaction.create(
      { inventoryItemId: item.id, type, quantity, note, eventId: eventId || null },
      { transaction: t }
    );
    await item.update({ quantityInStock: newQuantity }, { transaction: t });
    return tx;
  });

  res.status(201).json({ transaction: result, item: await item.reload() });
});

module.exports = {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  createTransaction,
};
