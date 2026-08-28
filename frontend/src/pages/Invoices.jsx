import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { invoiceApi } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Badge from '../components/Badge';
import { formatCurrency, formatDate } from '../utils/format';

const STATUS_FILTERS = ['all', 'draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'];

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async (status) => {
    setLoading(true);
    try {
      const res = await invoiceApi.list(status && status !== 'all' ? { status } : undefined);
      setInvoices(res.data);
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invoices</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Track billing and payments across all events</p>
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
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : invoices.length === 0 ? (
        <EmptyState title="No invoices found" description="Generate an invoice from an event's detail page." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Event / Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Issued</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Paid</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <Link to={`/invoices/${inv.id}`} className="font-medium text-slate-800 hover:text-slate-900 dark:text-slate-100">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                    <p>{inv.event?.title}</p>
                    <p className="text-xs text-slate-500">{inv.event?.customer?.name}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatDate(inv.issueDate)}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-slate-800 dark:text-slate-100">{formatCurrency(inv.totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-300">{formatCurrency(inv.amountPaid)}</td>
                  <td className="px-4 py-3"><Badge status={inv.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
