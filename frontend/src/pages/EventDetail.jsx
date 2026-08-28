import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, UserPlus, X, FileText, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { eventApi, staffApi, menuApi, invoiceApi } from '../api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import { formatCurrency, formatDate } from '../utils/format';

const STATUS_OPTIONS = ['inquiry', 'confirmed', 'in_progress', 'completed', 'cancelled'];

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState({});
  const [saving, setSaving] = useState(false);

  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({ staffId: '', assignedRole: '', hoursAssigned: '' });

  const [deleteEventConfirm, setDeleteEventConfirm] = useState(false);
  const [removeStaffTarget, setRemoveStaffTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await eventApi.get(id);
      setEvent(res.data);
    } catch (err) {
      toast.error('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    staffApi.list().then((res) => setStaffList(res.data));
    menuApi.listItems({ available: 'true' }).then((res) => setMenuItems(res.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openEdit = () => {
    setEditForm({
      title: event.title,
      eventType: event.eventType,
      eventDate: event.eventDate,
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      venue: event.venue || '',
      guestCount: event.guestCount,
      status: event.status,
      notes: event.notes || '',
      discount: event.discount,
      taxPercent: event.taxPercent,
    });
    const menuSel = {};
    (event.menuLines || []).forEach((line) => {
      menuSel[line.menuItemId] = line.quantity;
    });
    setSelectedMenu(menuSel);
    setEditModalOpen(true);
  };

  const toggleMenuItem = (itemId) => {
    setSelectedMenu((prev) => {
      const copy = { ...prev };
      if (copy[itemId] !== undefined) delete copy[itemId];
      else copy[itemId] = 1;
      return copy;
    });
  };

  const updateQuantity = (itemId, qty) => {
    setSelectedMenu((prev) => ({ ...prev, [itemId]: Math.max(1, Number(qty) || 1) }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        guestCount: Number(editForm.guestCount) || 0,
        discount: Number(editForm.discount) || 0,
        taxPercent: Number(editForm.taxPercent) || 0,
        menuItems: Object.entries(selectedMenu).map(([menuItemId, quantity]) => ({
          menuItemId: Number(menuItemId),
          quantity,
        })),
      };
      await eventApi.update(id, payload);
      toast.success('Event updated');
      setEditModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await eventApi.update(id, { status });
      toast.success('Status updated');
      load();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await eventApi.remove(id);
      toast.success('Event deleted');
      navigate('/events');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleAssignStaff = async (e) => {
    e.preventDefault();
    if (!staffForm.staffId) return toast.error('Select a staff member');
    try {
      await eventApi.assignStaff(id, { ...staffForm, hoursAssigned: Number(staffForm.hoursAssigned) || 0 });
      toast.success('Staff assigned');
      setStaffModalOpen(false);
      setStaffForm({ staffId: '', assignedRole: '', hoursAssigned: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign staff');
    }
  };

  const handleRemoveStaff = async () => {
    try {
      await eventApi.removeStaff(id, removeStaffTarget.staffId);
      toast.success('Staff removed from event');
      setRemoveStaffTarget(null);
      load();
    } catch (err) {
      toast.error('Failed to remove staff');
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      const res = await invoiceApi.createFromEvent({ eventId: id });
      toast.success('Invoice generated');
      navigate(`/invoices/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!event) return <p className="text-sm text-slate-500">Event not found.</p>;

  const totals = event.totals || { subtotal: 0, discount: 0, tax: 0, total: 0 };
  const assignedStaffIds = new Set((event.staffAssignments || []).map((a) => a.staffId));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/events" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
          <ArrowLeft size={16} /> Back to events
        </Link>
        <div className="flex gap-2">
          <button onClick={openEdit} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            <Pencil size={14} /> Edit
          </button>
          <button onClick={() => setDeleteEventConfirm(true)} className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{event.title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <Link to={`/customers/${event.customerId}`} className="hover:text-indigo-600 hover:underline">{event.customer?.name}</Link> · {event.eventType}
            </p>
          </div>
          <select
            value={event.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Info label="Date" value={formatDate(event.eventDate)} />
          <Info label="Time" value={event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : '—'} />
          <Info label="Venue" value={event.venue || '—'} />
          <Info label="Guests" value={event.guestCount} />
        </div>
        {event.notes && (
          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">Notes</p>
            <p className="text-sm text-slate-700 dark:text-slate-200">{event.notes}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Menu lines */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Menu Selection</h2>
          {(!event.menuLines || event.menuLines.length === 0) ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No menu items selected yet. Click Edit to add dishes.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400 dark:border-slate-800">
                  <th className="pb-2">Item</th>
                  <th className="pb-2 text-right">Price/head</th>
                  <th className="pb-2 text-right">Servings</th>
                  <th className="pb-2 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {event.menuLines.map((line) => (
                  <tr key={line.id}>
                    <td className="py-2 text-slate-700 dark:text-slate-200">{line.menuItem?.name}</td>
                    <td className="py-2 text-right text-slate-600 dark:text-slate-300">{formatCurrency(line.priceAtBooking)}</td>
                    <td className="py-2 text-right text-slate-600 dark:text-slate-300">{line.quantity} × {event.guestCount}</td>
                    <td className="py-2 text-right font-medium text-slate-800 dark:text-slate-100">
                      {formatCurrency(Number(line.priceAtBooking) * Number(line.quantity) * Number(event.guestCount || 1))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Discount</span>
              <span>-{formatCurrency(totals.discount)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Tax ({Number(event.taxPercent)}%)</span>
              <span>{formatCurrency(totals.tax)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>

        {/* Staff assignments */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Staff Assigned</h2>
            <button onClick={() => setStaffModalOpen(true)} className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
              <UserPlus size={14} /> Assign
            </button>
          </div>
          {(!event.staffAssignments || event.staffAssignments.length === 0) ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No staff assigned yet.</p>
          ) : (
            <ul className="space-y-3">
              {event.staffAssignments.map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{a.staff?.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{a.assignedRole || a.staff?.role} · {Number(a.hoursAssigned)}h</p>
                  </div>
                  <button onClick={() => setRemoveStaffTarget(a)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800">
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Invoices */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Invoices</h2>
          <button onClick={handleGenerateInvoice} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
            <Plus size={14} /> Generate Invoice
          </button>
        </div>
        {(!event.invoices || event.invoices.length === 0) ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No invoices generated for this event yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {event.invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-3">
                <Link to={`/invoices/${inv.id}`} className="flex items-center gap-2 font-medium text-slate-800 hover:text-indigo-600 dark:text-slate-100">
                  <FileText size={16} /> {inv.invoiceNumber}
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{formatCurrency(inv.totalAmount)}</span>
                  <Badge status={inv.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Edit modal */}
      {editForm && (
        <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Event" size="xl">
          <form onSubmit={handleEditSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Event title *</label>
                <input required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Event type</label>
                <input value={editForm.eventType} onChange={(e) => setEditForm({ ...editForm, eventType: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Guest count</label>
                <input type="number" min="0" value={editForm.guestCount} onChange={(e) => setEditForm({ ...editForm, guestCount: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Event date *</label>
                <input type="date" required value={editForm.eventDate} onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Venue</label>
                <input value={editForm.venue} onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Start time</label>
                <input type="time" value={editForm.startTime} onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">End time</label>
                <input type="time" value={editForm.endTime} onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Discount ($)</label>
                <input type="number" min="0" step="0.01" value={editForm.discount} onChange={(e) => setEditForm({ ...editForm, discount: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Tax (%)</label>
                <input type="number" min="0" step="0.01" value={editForm.taxPercent} onChange={(e) => setEditForm({ ...editForm, taxPercent: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
              <textarea rows={2} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Menu selection</label>
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                {menuItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <label className="flex flex-1 items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input type="checkbox" checked={selectedMenu[item.id] !== undefined} onChange={() => toggleMenuItem(item.id)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      {item.name} <span className="text-xs text-slate-400">({formatCurrency(item.pricePerHead)}/head)</span>
                    </label>
                    {selectedMenu[item.id] !== undefined && (
                      <input type="number" min="1" value={selectedMenu[item.id]} onChange={(e) => updateQuantity(item.id, e.target.value)} className="w-16 rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditModalOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign staff modal */}
      <Modal open={staffModalOpen} onClose={() => setStaffModalOpen(false)} title="Assign Staff" size="sm">
        <form onSubmit={handleAssignStaff} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Staff member</label>
            <select value={staffForm.staffId} onChange={(e) => setStaffForm({ ...staffForm, staffId: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <option value="">Select staff…</option>
              {staffList.filter((s) => !assignedStaffIds.has(s.id)).map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Role on this event</label>
            <input value={staffForm.assignedRole} onChange={(e) => setStaffForm({ ...staffForm, assignedRole: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Hours assigned</label>
            <input type="number" min="0" step="0.5" value={staffForm.hoursAssigned} onChange={(e) => setStaffForm({ ...staffForm, hoursAssigned: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setStaffModalOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Assign
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteEventConfirm}
        message="Delete this event? All menu selections, staff assignments, and invoices will be removed."
        onConfirm={handleDeleteEvent}
        onCancel={() => setDeleteEventConfirm(false)}
      />
      <ConfirmDialog
        open={!!removeStaffTarget}
        message={`Remove ${removeStaffTarget?.staff?.name} from this event?`}
        onConfirm={handleRemoveStaff}
        onCancel={() => setRemoveStaffTarget(null)}
      />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-medium text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}
