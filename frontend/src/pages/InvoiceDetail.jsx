import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { invoiceApi } from '../api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import { formatCurrency, formatDate } from '../utils/format';

const emptyPaymentForm = { amount: '', method: 'cash', paymentDate: new Date().toISOString().slice(0, 10), reference: '', notes: '' };

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [deletePaymentTarget, setDeletePaymentTarget] = useState(null);
  const [deleteInvoiceConfirm, setDeleteInvoiceConfirm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await invoiceApi.get(id);
      setInvoice(res.data);
    } catch (err) {
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await invoiceApi.addPayment(id, { ...paymentForm, amount: Number(paymentForm.amount) });
      toast.success('Payment recorded');
      setPaymentModalOpen(false);
      setPaymentForm(emptyPaymentForm);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleDeletePayment = async () => {
    try {
      await invoiceApi.removePayment(id, deletePaymentTarget.id);
      toast.success('Payment removed');
      setDeletePaymentTarget(null);
      load();
    } catch (err) {
      toast.error('Failed to remove payment');
    }
  };

  const handleDeleteInvoice = async () => {
    try {
      await invoiceApi.remove(id);
      toast.success('Invoice deleted');
      navigate('/invoices');
    } catch (err) {
      toast.error('Failed to delete invoice');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!invoice) return <p className="text-sm text-slate-500">Invoice not found.</p>;

  const balanceDue = Number(invoice.totalAmount) - Number(invoice.amountPaid);

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link to="/invoices" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
          <ArrowLeft size={16} /> Back to invoices
        </Link>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            <Printer size={14} /> Print
          </button>
          <button onClick={() => setDeleteInvoiceConfirm(true)} className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{invoice.invoiceNumber}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              For event: <Link to={`/events/${invoice.eventId}`} className="hover:text-indigo-600 hover:underline">{invoice.event?.title}</Link>
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Bill to: {invoice.event?.customer?.name}</p>
          </div>
          <Badge status={invoice.status} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Info label="Issue date" value={formatDate(invoice.issueDate)} />
          <Info label="Due date" value={formatDate(invoice.dueDate)} />
          <Info label="Total amount" value={formatCurrency(invoice.totalAmount)} />
          <Info label="Balance due" value={formatCurrency(balanceDue)} highlight={balanceDue > 0} />
        </div>

        <div className="mt-6 space-y-1 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Discount</span>
            <span>-{formatCurrency(invoice.discount)}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Tax</span>
            <span>{formatCurrency(invoice.tax)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
            <span>Total</span>
            <span>{formatCurrency(invoice.totalAmount)}</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">Notes</p>
            <p className="text-sm text-slate-700 dark:text-slate-200">{invoice.notes}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:border-0 print:shadow-none">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Payment History</h2>
          {balanceDue > 0 && (
            <button onClick={() => { setPaymentForm({ ...emptyPaymentForm, amount: balanceDue.toFixed(2) }); setPaymentModalOpen(true); }} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
              <Plus size={14} /> Record Payment
            </button>
          )}
        </div>
        {(!invoice.payments || invoice.payments.length === 0) ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No payments recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400 dark:border-slate-800">
                <th className="pb-2">Date</th>
                <th className="pb-2">Method</th>
                <th className="pb-2">Reference</th>
                <th className="pb-2 text-right">Amount</th>
                <th className="pb-2 print:hidden"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoice.payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 text-slate-700 dark:text-slate-200">{formatDate(p.paymentDate)}</td>
                  <td className="py-2 capitalize text-slate-600 dark:text-slate-300">{p.method.replace('_', ' ')}</td>
                  <td className="py-2 text-slate-600 dark:text-slate-300">{p.reference || '—'}</td>
                  <td className="py-2 text-right font-medium text-slate-800 dark:text-slate-100">{formatCurrency(p.amount)}</td>
                  <td className="py-2 text-right print:hidden">
                    <button onClick={() => setDeletePaymentTarget(p)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Record Payment" size="sm">
        <form onSubmit={handleAddPayment} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Amount ($) *</label>
            <input type="number" min="0.01" step="0.01" required value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Method</label>
            <select value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Payment date</label>
            <input type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Reference</label>
            <input value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setPaymentModalOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Save Payment
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deletePaymentTarget}
        message={`Remove this payment of ${formatCurrency(deletePaymentTarget?.amount)}?`}
        onConfirm={handleDeletePayment}
        onCancel={() => setDeletePaymentTarget(null)}
      />
      <ConfirmDialog
        open={deleteInvoiceConfirm}
        message="Delete this invoice and all its payment records?"
        onConfirm={handleDeleteInvoice}
        onCancel={() => setDeleteInvoiceConfirm(false)}
      />
    </div>
  );
}

function Info({ label, value, highlight }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`font-medium ${highlight ? 'text-rose-600' : 'text-slate-800 dark:text-slate-100'}`}>{value}</p>
    </div>
  );
}
