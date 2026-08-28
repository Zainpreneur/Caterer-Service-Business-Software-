export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-3 text-slate-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-500" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
