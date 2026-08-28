export default function StatCard({ label, value, icon: Icon, accent = 'slate', sub }) {
  const accents = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  };
  return (
    <div className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
        {sub && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
      </div>
      {Icon && (
        <div className={`rounded-lg p-2.5 ${accents[accent]}`}>
          <Icon size={20} />
        </div>
      )}
    </div>
  );
}
