import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, CalendarDays, DollarSign, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import { dashboardApi } from '../api';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import { formatCurrency, formatDate } from '../utils/format';

// Matches the semantic status colors used by the Badge component (amber/blue/purple/emerald/rose)
// so this chart stays consistent with status badges shown elsewhere in the app.
const PIE_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#f43f5e'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .summary()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard…" />;
  if (!data) return null;

  const statusData = data.eventStatusCounts.map((s) => ({ name: s.status, value: s.count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Overview of your catering business</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Customers" value={data.totalCustomers} icon={Users} accent="slate" />
        <StatCard label="Events This Month" value={data.eventsThisMonth} icon={CalendarDays} accent="amber" />
        <StatCard
          label="Revenue Collected"
          value={formatCurrency(data.totalRevenue)}
          icon={DollarSign}
          accent="emerald"
          sub={`${formatCurrency(data.revenueThisMonth)} this month`}
        />
        <StatCard
          label="Outstanding Balance"
          value={formatCurrency(data.outstandingAmount)}
          icon={AlertTriangle}
          accent="rose"
          sub={`${data.lowStockCount} item(s) low on stock`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Top Menu Items Booked</h2>
          {data.topMenuItems.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No bookings yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.topMenuItems} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis type="number" allowDecimals={false} stroke="currentColor" className="text-xs text-slate-500" />
                <YAxis type="category" dataKey="name" width={160} stroke="currentColor" className="text-xs text-slate-500" />
                <Tooltip />
                <Bar dataKey="quantity" fill="#334155" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Events by Status</h2>
          {statusData.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No events yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Upcoming Events</h2>
            <Link to="/events" className="text-sm font-medium text-slate-900 hover:underline">
              View all
            </Link>
          </div>
          {data.upcomingEvents.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming events scheduled.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.upcomingEvents.map((ev) => (
                <li key={ev.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link to={`/events/${ev.id}`} className="font-medium text-slate-800 hover:text-slate-900 dark:text-slate-100">
                      {ev.title}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(ev.eventDate)} · {ev.customer?.name} · {ev.guestCount} guests
                    </p>
                  </div>
                  <Badge status={ev.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Low Stock Alerts</h2>
            <Link to="/inventory" className="text-sm font-medium text-slate-900 hover:underline">
              View inventory
            </Link>
          </div>
          {data.lowStockItems.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">All inventory levels look healthy.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.lowStockItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {Number(item.quantityInStock)} {item.unit} in stock (reorder at {Number(item.reorderLevel)})
                    </p>
                  </div>
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-500/15 dark:text-rose-300">
                    Low stock
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
