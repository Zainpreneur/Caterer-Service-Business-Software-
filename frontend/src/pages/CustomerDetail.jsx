import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { customerApi } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import { formatDate } from '../utils/format';

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerApi
      .get(id)
      .then((res) => setCustomer(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!customer) return <p className="text-sm text-slate-500">Customer not found.</p>;

  return (
    <div className="space-y-6">
      <Link to="/customers" className="inline-flex items-center gap-1 text-sm font-medium text-slate-900 hover:underline">
        <ArrowLeft size={16} /> Back to customers
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{customer.name}</h1>
        {customer.company && <p className="text-sm text-slate-500 dark:text-slate-400">{customer.company}</p>}
        <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-slate-500 dark:text-slate-400">Email</p>
            <p className="font-medium text-slate-800 dark:text-slate-100">{customer.email || '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Phone</p>
            <p className="font-medium text-slate-800 dark:text-slate-100">{customer.phone || '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Address</p>
            <p className="font-medium text-slate-800 dark:text-slate-100">{customer.address || '—'}</p>
          </div>
        </div>
        {customer.notes && (
          <div className="mt-4">
            <p className="text-slate-500 dark:text-slate-400 text-sm">Notes</p>
            <p className="text-sm text-slate-700 dark:text-slate-200">{customer.notes}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Events</h2>
        {(!customer.events || customer.events.length === 0) ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No events for this customer yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {customer.events.map((ev) => (
              <li key={ev.id} className="flex items-center justify-between py-3">
                <div>
                  <Link to={`/events/${ev.id}`} className="font-medium text-slate-800 hover:text-slate-900 dark:text-slate-100">
                    {ev.title}
                  </Link>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(ev.eventDate)} · {ev.guestCount} guests
                  </p>
                </div>
                <Badge status={ev.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
