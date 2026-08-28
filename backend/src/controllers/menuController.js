const { MenuCategory, MenuItem } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

// ---- Categories ----
const getCategories = asyncHandler(async (req, res) => {
  const categories = await MenuCategory.findAll({
    include: [{ model: MenuItem, as: 'items' }],
    order: [['name', 'ASC']],
  });
  res.json(categories);
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Category name is required' });
  const category = await MenuCategory.create({ name, description });
  res.status(201).json(category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await MenuCategory.findByPk(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  const { name, description } = req.body;
  await category.update({ name, description });
  res.json(category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await MenuCategory.findByPk(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  await category.destroy();
  res.json({ message: 'Category deleted' });
});

// ---- Menu Items ----
const getMenuItems = asyncHandler(async (req, res) => {
  const { categoryId, available } = req.query;
  const where = {};
  if (categoryId) where.categoryId = categoryId;
  if (available !== undefined) where.isAvailable = available === 'true';

  const items = await MenuItem.findAll({
    where,
    include: [{ model: MenuCategory, as: 'category' }],
    order: [['name', 'ASC']],
  });
  res.json(items);
});

const getMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByPk(req.params.id, {
    include: [{ model: MenuCategory, as: 'category' }],
  });
  if (!item) return res.status(404).json({ message: 'Menu item not found' });
  res.json(item);
});

const createMenuItem = asyncHandler(async (req, res) => {
  const { name, description, pricePerHead, categoryId, isVegetarian, isVegan, isAvailable } = req.body;
  if (!name || pricePerHead === undefined) {
    return res.status(400).json({ message: 'Name and price per head are required' });
  }
  const item = await MenuItem.create({
    name,
    description,
    pricePerHead,
    categoryId: categoryId || null,
    isVegetarian: !!isVegetarian,
    isVegan: !!isVegan,
    isAvailable: isAvailable === undefined ? true : !!isAvailable,
  });
  res.status(201).json(item);
});

const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'Menu item not found' });
  const { name, description, pricePerHead, categoryId, isVegetarian, isVegan, isAvailable } = req.body;
  await item.update({
    name: name ?? item.name,
    description: description ?? item.description,
    pricePerHead: pricePerHead ?? item.pricePerHead,
    categoryId: categoryId === undefined ? item.categoryId : categoryId,
    isVegetarian: isVegetarian === undefined ? item.isVegetarian : !!isVegetarian,
    isVegan: isVegan === undefined ? item.isVegan : !!isVegan,
    isAvailable: isAvailable === undefined ? item.isAvailable : !!isAvailable,
  });
  res.json(item);
});

const deleteMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByPk(req.params.id);
  if (!item) return res.status(404).json({ message: 'Menu item not found' });
  await item.destroy();
  res.json({ message: 'Menu item deleted' });
});

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
