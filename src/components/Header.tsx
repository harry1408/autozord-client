import { Bell, ChevronDown, LogOut, Moon, Sun, Car, UserPlus, Menu, Search, Plus, Zap } from 'lucide-react';
import { LogoIcon } from '@/components/ui/Logo';
import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { useQuickActionsStore } from '@/store/quickActions.store';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Customer, Vehicle } from '@/types';
import toast from 'react-hot-toast';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/repair-orders': 'Job Board',
  '/estimates':     'Estimates',
  '/customers':     'Customers',
  '/vehicles':      'Vehicles',
  '/invoices':      'Invoices',
  '/payments':      'Payments',
  '/technicians':   'Technicians',
  '/inspections':   'Inspections',
  '/inventory':     'Inventory',
  '/reports':       'Reports',
  '/settings':      'Settings',
};

/* ─── Customer search dropdown ──────────────────────────────── */
function CustomerSearchDropdown() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data, isFetching } = useQuery({
    queryKey: ['hdr-cust-search', query],
    queryFn: () => api.get(`/customers?search=${query}&limit=8`),
    enabled: query.length >= 2,
  });
  const results: Customer[] = data?.data.data ?? [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors text-sm text-gray-600 dark:text-gray-300 min-w-[160px]"
      >
        <Search size={14} className="text-gray-400 shrink-0" />
        <span className="flex-1 text-left truncate">Search Customer</span>
        <ChevronDown size={13} className="text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 w-80 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-zinc-800">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                placeholder="Name or phone…"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {isFetching ? (
              <div className="py-6 text-center text-xs text-gray-400">Searching…</div>
            ) : results.length === 0 && query.length >= 2 ? (
              <div className="py-6 text-center text-xs text-gray-400">No customers found</div>
            ) : query.length < 2 ? (
              <div className="py-6 text-center text-xs text-gray-400">Type 2+ characters</div>
            ) : (
              results.map(c => (
                <button
                  key={c.id}
                  onClick={() => { navigate(`/customers/${c.id}`); setOpen(false); setQuery(''); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">
                      {c.firstName[0]}{c.lastName[0]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.firstName} {c.lastName}</p>
                    <p className="text-xs text-gray-400 truncate">{c.phone}</p>
                  </div>
                </button>
              ))
            )}
          </div>
          {query.length >= 2 && results.length > 0 && (
            <div className="border-t border-gray-100 dark:border-zinc-800 p-2">
              <button
                onClick={() => { navigate(`/customers?search=${query}`); setOpen(false); setQuery(''); }}
                className="w-full text-center text-xs text-brand-600 dark:text-brand-400 hover:underline py-1"
              >
                View all results
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Vehicle search dropdown ───────────────────────────────── */
function VehicleSearchDropdown() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data, isFetching } = useQuery({
    queryKey: ['hdr-veh-search', query],
    queryFn: () => api.get(`/vehicles?search=${query}&limit=8`),
    enabled: query.length >= 2,
  });
  const results: Vehicle[] = data?.data.data ?? [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors text-sm text-gray-600 dark:text-gray-300"
        title="Search vehicle"
      >
        <Search size={14} className="text-gray-400 shrink-0" />
        <Car size={14} className="text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 w-80 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-zinc-800">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                placeholder="Make, model or VIN…"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {isFetching ? (
              <div className="py-6 text-center text-xs text-gray-400">Searching…</div>
            ) : results.length === 0 && query.length >= 2 ? (
              <div className="py-6 text-center text-xs text-gray-400">No vehicles found</div>
            ) : query.length < 2 ? (
              <div className="py-6 text-center text-xs text-gray-400">Type 2+ characters</div>
            ) : (
              results.map(v => (
                <button
                  key={v.id}
                  onClick={() => { navigate(`/vehicles/${v.id}`); setOpen(false); setQuery(''); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <Car size={13} className="text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {v.year} {v.make} {v.model}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {v.licensePlate || v.vin || 'No plate'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Header ──────────────────────────────────────────────── */
interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { setAddCustomerOpen, setAddVehicleOpen } = useQuickActionsStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const pageTitle = Object.entries(ROUTE_TITLES).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1] ?? 'Autozord';

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '??';

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    logout();
    navigate('/login');
    toast.success('Logged out');
  };

  return (
    <header className="h-14 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex items-center gap-3 px-4 shrink-0">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <Menu size={18} className="text-gray-600 dark:text-gray-400" />
      </button>

      {/* Mobile logo (in header, visible when sidebar is hidden) */}
      <div className="lg:hidden shrink-0">
        <LogoIcon className="h-8 w-8" />
      </div>

      {/* Page title */}
      <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 shrink-0 mr-1 hidden sm:block">
        {pageTitle}
      </h1>

      {/* Quick action buttons */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {/* Add RO */}
        <button
          onClick={() => navigate('/repair-orders?new=1')}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-brand-300 hover:text-brand-600 transition-colors text-xs font-medium text-gray-600 dark:text-gray-300"
          title="New Repair Order"
        >
          <Plus size={13} />
          <Car size={13} />
        </button>

        {/* Add Vehicle */}
        <button
          onClick={() => setAddVehicleOpen(true)}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-brand-300 hover:text-brand-600 transition-colors text-xs font-medium text-gray-600 dark:text-gray-300"
          title="Add Vehicle"
        >
          <Car size={13} />
          <Plus size={10} className="-ml-0.5" />
        </button>

        {/* Search Vehicle */}
        <VehicleSearchDropdown />

        {/* Add Customer */}
        <button
          onClick={() => setAddCustomerOpen(true)}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-brand-300 hover:text-brand-600 transition-colors text-xs font-medium text-gray-600 dark:text-gray-300"
          title="Add Customer"
        >
          <Plus size={13} />
          <UserPlus size={13} />
        </button>

        {/* Search Customer */}
        <CustomerSearchDropdown />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick Checkout */}
        <button
          onClick={() => navigate('/payments')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-full transition-colors shadow-sm shadow-brand-900/20"
        >
          <Zap size={12} />
          Quick Checkout
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          title="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon size={16} className="text-gray-500" />
          ) : (
            <Sun size={16} className="text-yellow-400" />
          )}
        </button>

        {/* Notifications */}
        <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors relative">
          <Bell size={16} className="text-gray-500 dark:text-gray-400" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-[10px] font-bold">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 leading-none">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
            <ChevronDown size={12} className="text-gray-400 hidden sm:block" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-xl z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
