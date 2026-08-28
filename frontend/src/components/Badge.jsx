import { STATUS_STYLES, statusLabel } from '../utils/format';

export default function Badge({ status, children }) {
  const style = STATUS_STYLES[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${style}`}>
      {children || statusLabel(status)}
    </span>
  );
}
