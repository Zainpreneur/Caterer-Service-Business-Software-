import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  CalendarDays,
  HardHat,
  Boxes,
  Receipt,
  LogOut,
  ChefHat,
  Menu as MenuIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/staff', label: 'Staff', icon: HardHat },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/invoices', label: 'Invoices', icon: Receipt },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <ChefHat className="text-slate-900" size={22} />
          Caterly
        </div>
        <button onClick={() => setSidebarOpen((v) => !v)} className="text-slate-600 dark:text-slate-300">
          <MenuIcon size={22} />
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white p-4 transition-transform md:static md:translate-x-0 dark:border-slate-800 dark:bg-slate-900 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-6 hidden items-center gap-2 px-2 text-xl font-bold text-slate-900 md:flex dark:text-white">
            <ChefHat className="text-slate-900" size={26} />
            Caterly
          </div>

          <nav className="space-y-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="absolute bottom-4 left-4 right-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="mb-3 px-2">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{user?.name}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-slate-900/40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main content */}
        <main className="min-h-screen flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
