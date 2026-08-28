import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import { menuApi } from '../api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatCurrency } from '../utils/format';

const emptyItemForm = {
  name: '',
  description: '',
  pricePerHead: '',
  categoryId: '',
  isVegetarian: false,
  isVegan: false,
  isAvailable: true,
};

export default function Menu() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItemTarget, setDeleteItemTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await menuApi.listCategories();
      setCategories(res.data);
    } catch (err) {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const allItems = categories.flatMap((c) => c.items || []);
  const displayedItems = activeCategory === 'all' ? allItems : allItems.filter((i) => i.categoryId === Number(activeCategory));

  // ---- Category handlers ----
  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
    setCategoryModalOpen(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name, description: cat.description || '' });
    setCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCategory) {
        await menuApi.updateCategory(editingCategory.id, categoryForm);
        toast.success('Category updated');
      } else {
        await menuApi.createCategory(categoryForm);
        toast.success('Category created');
      }
      setCategoryModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    try {
      await menuApi.removeCategory(deleteCategoryTarget.id);
      toast.success('Category deleted');
      setDeleteCategoryTarget(null);
      if (activeCategory === String(deleteCategoryTarget.id)) setActiveCategory('all');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  // ---- Item handlers ----
  const openCreateItem = () => {
    setEditingItem(null);
    setItemForm({ ...emptyItemForm, categoryId: activeCategory !== 'all' ? activeCategory : '' });
    setItemModalOpen(true);
  };

  const openEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      pricePerHead: item.pricePerHead,
      categoryId: item.categoryId || '',
      isVegetarian: item.isVegetarian,
      isVegan: item.isVegan,
      isAvailable: item.isAvailable,
    });
    setItemModalOpen(true);
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...itemForm, categoryId: itemForm.categoryId || null, pricePerHead: Number(itemForm.pricePerHead) };
      if (editingItem) {
        await menuApi.updateItem(editingItem.id, payload);
        toast.success('Menu item updated');
      } else {
        await menuApi.createItem(payload);
        toast.success('Menu item created');
      }
      setItemModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    try {
      await menuApi.removeItem(deleteItemTarget.id);
      toast.success('Menu item deleted');
      setDeleteItemTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete item');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Menu</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage categories and dishes offered to clients</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openCreateCategory} className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            <Plus size={16} /> Category
          </button>
          <button onClick={openCreateItem} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <Plus size={16} /> Menu Item
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
            activeCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700'
          }`}
        >
          All ({allItems.length})
        </button>
        {categories.map((cat) => (
          <div key={cat.id} className="group relative">
            <button
              onClick={() => setActiveCategory(String(cat.id))}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
                activeCategory === String(cat.id) ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              {cat.name} ({cat.items?.length || 0})
            </button>
            <span className="absolute -right-1 -top-1 hidden gap-0.5 rounded-full bg-white p-0.5 shadow group-hover:flex dark:bg-slate-800">
              <button onClick={() => openEditCategory(cat)} className="rounded p-0.5 text-slate-500 hover:text-indigo-600">
                <Pencil size={11} />
              </button>
              <button onClick={() => setDeleteCategoryTarget(cat)} className="rounded p-0.5 text-slate-500 hover:text-rose-600">
                <Trash2 size={11} />
              </button>
            </span>
          </div>
        ))}
      </div>

      {displayedItems.length === 0 ? (
        <EmptyState title="No menu items" description="Add dishes so you can build event menus." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedItems.map((item) => (
            <div key={item.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">{item.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => openEditItem(item)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteItemTarget(item)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {item.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-semibold text-indigo-600">{formatCurrency(item.pricePerHead)} <span className="text-xs font-normal text-slate-400">/ head</span></span>
                {!item.isAvailable && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800">Unavailable</span>
                )}
              </div>
              {(item.isVegetarian || item.isVegan) && (
                <div className="mt-2 flex gap-1.5">
                  {item.isVegetarian && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                      <Leaf size={10} /> Vegetarian
                    </span>
                  )}
                  {item.isVegan && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                      <Leaf size={10} /> Vegan
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      <Modal open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} title={editingCategory ? 'Edit Category' : 'New Category'} size="sm">
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name *</label>
            <input
              required
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              rows={2}
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCategoryModalOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Item Modal */}
      <Modal open={itemModalOpen} onClose={() => setItemModalOpen(false)} title={editingItem ? 'Edit Menu Item' : 'New Menu Item'}>
        <form onSubmit={handleItemSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name *</label>
            <input
              required
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              rows={2}
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Price per head ($) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={itemForm.pricePerHead}
                onChange={(e) => setItemForm({ ...itemForm, pricePerHead: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
              <select
                value={itemForm.categoryId}
                onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 pt-1">
            <Checkbox label="Vegetarian" checked={itemForm.isVegetarian} onChange={(v) => setItemForm({ ...itemForm, isVegetarian: v })} />
            <Checkbox label="Vegan" checked={itemForm.isVegan} onChange={(v) => setItemForm({ ...itemForm, isVegan: v })} />
            <Checkbox label="Available" checked={itemForm.isAvailable} onChange={(v) => setItemForm({ ...itemForm, isAvailable: v })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setItemModalOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteCategoryTarget}
        message={`Delete category "${deleteCategoryTarget?.name}"? Items in it will become uncategorized.`}
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeleteCategoryTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteItemTarget}
        message={`Delete menu item "${deleteItemTarget?.name}"?`}
        onConfirm={handleDeleteItem}
        onCancel={() => setDeleteItemTarget(null)}
      />
    </div>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
      {label}
    </label>
  );
}
