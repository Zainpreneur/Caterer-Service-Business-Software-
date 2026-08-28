import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users as UsersIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { eventApi, customerApi, menuApi } from '../api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import { formatCurrency, formatDate, statusLabel } from '../utils/format';

const STATUS_FILTERS = ['all', 'inquiry', 'confirmed', 'in_progress', 'completed', 'cancelled'];

const emptyForm = {
  customerId: '',
  title: '',
  eventType: 'General',
  eventDate: '',
  startTime: '',
  endTime: '',
  venue: '',
  guestCount: '',
  notes: '',
  discount: 0,
  taxPercent: 0,
};

export default function Events() {
  const [events, setEvents] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedMenu, setSelectedMenu] = useState({}); // { menuItemId: quantity }
  const [saving, setSaving] = useState(false);

  const load = async (status) => {
    setLoading(true);
    try {
      const res = await eventApi.list(status && status !== 'all' ? { status } : undefined);
      setEvents(res.data);
    } catch (err) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    customerApi.list().then((res) => setCustomers(res.data));
    menuApi.listItems({ available: 'true' }).then((res) => setMenuItems(res.data));
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setSelectedMenu({});
    setModalOpen(true);
  };

  const toggleMenuItem = (id) => {
    setSelectedMenu((prev) => {
      const copy = { ...prev };
      if (copy[id] !== undefined) delete copy[id];
      else copy[id] = 1;
      return copy;
    });
  };

  const updateQuantity = (id, qty) => {
    setSelectedMenu((prev) => ({ ...prev, [id]: Math.max(1, Number(qty) || 1) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        guestCount: Number(form.guestCount) || 0,
        discount: Number(form.discount) || 0,
        taxPercent: Number(form.taxPercent) || 0,
        menuItems: Object.entries(selectedMenu).map(([menuItemId, quantity]) => ({
          menuItemId: Number(menuItemId),
          quantity,
        })),
      };
      const res = await eventApi.create(payload);
      toast.success('Event created');
      setModalOpen(false);
      load(statusFilter);
      window.location.assign(`/events/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Events</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage bookings from inquiry through completion</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900">
          <Plus size={16} /> New Event
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize ${
              statusFilter === s ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            {s === 'all' ? 'All' : statusLabel(s)}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : events.length === 0 ? (
        <EmptyState title="No events found" description="Create your first booking to get started." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {events.map((ev) => (
            <Link
              key={ev.id}
              to={`/events/${ev.id}`}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{ev.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{ev.customer?.name} · {ev.eventType}</p>
                </div>
                <Badge status={ev.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
                <span>{formatDate(ev.eventDate)}</span>
                {ev.venue && <span>· {ev.venue}</span>}
                <span className="flex items-center gap-1"><UsersIcon size={14} /> {ev.guestCount}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">Estimated total</span>
                <span className="font-semibold text-slate-900">{formatCurrency(ev.totals?.total)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Event" size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Customer *</label>
              <select required value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                <option value="">Select a customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Event title *</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Event type</label>
              <input value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })} placeholder="Wedding, Corporate, Birthday…" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Guest count</label>
              <input type="number" min="0" value={form.guestCount} onChange={(e) => setForm({ ...form, guestCount: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Event date *</label>
              <input type="date" required value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Venue</label>
              <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Start time</label>
              <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">End time</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Discount ($)</label>
              <input type="number" min="0" step="0.01" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Tax (%)</label>
              <input type="number" min="0" step="0.01" value={form.taxPercent} onChange={(e) => setForm({ ...form, taxPercent: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Menu selection (per head)</label>
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700">
              {menuItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <label className="flex flex-1 items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={selectedMenu[item.id] !== undefined}
                      onChange={() => toggleMenuItem(item.id)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                    />
                    {item.name} <span className="text-xs text-slate-400">({formatCurrency(item.pricePerHead)}/head)</span>
                  </label>
                  {selectedMenu[item.id] !== undefined && (
                    <input
                      type="number"
                      min="1"
                      value={selectedMenu[item.id]}
                      onChange={(e) => updateQuantity(item.id, e.target.value)}
                      className="w-16 rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      title="Servings multiplier per guest"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60">
              {saving ? 'Creating…' : 'Create Event'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
