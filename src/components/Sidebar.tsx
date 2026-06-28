import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Car, FileText, Receipt,
  CreditCard, UserCog, Search, Package, BarChart3, Settings, Wrench, X,
} from 'lucide-react';
import { LogoIcon, LogoFull } from '@/components/ui/Logo';

const NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/repair-orders',icon: Wrench,          label: 'Job Board'    },
  { to: '/estimates',    icon: FileText,        label: 'Estimates'    },
  { to: '/customers',    icon: Users,           label: 'Customers'    },
  { to: '/vehicles',     icon: Car,             label: 'Vehicles'     },
  { to: '/invoices',     icon: Receipt,         label: 'Invoices'     },
  { to: '/payments',     icon: CreditCard,      label: 'Payments'     },
  { to: '/technicians',  icon: UserCog,         label: 'Technicians'  },
  { to: '/inspections',  icon: Search,          label: 'Inspections'  },
  { to: '/inventory',    icon: Package,         label: 'Inventory'    },
  { to: '/reports',      icon: BarChart3,       label: 'Reports'      },
  { to: '/settings',     icon: Settings,        label: 'Settings'     },
];

function ClockWidget() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const hh = now.getHours().toString().padStart(2,'0');
  const mm = now.getMinutes().toString().padStart(2,'0');
  return (
    <div className="flex flex-col items-center py-2.5 border-b border-white/10">
      <span className="text-[10px] font-bold text-brand-400 tracking-widest uppercase">
        {days[now.getDay()]}
      </span>
      <span className="text-sm font-bold text-white tabular-nums leading-tight">
        {hh}:{mm}
      </span>
    </div>
  );
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-20 bg-black/70 lg:hidden" onClick={onClose} />
      )}

      {/* Desktop: icon-only narrow sidebar */}
      <aside className="hidden lg:flex flex-col w-[64px] bg-zinc-950 border-r border-white/[0.06] shrink-0 z-30 h-screen">
        {/* Logo */}
        <div className="flex items-center justify-center h-14 border-b border-white/10 shrink-0">
          <LogoIcon className="h-10 w-10" />
        </div>

        {/* Clock */}
        <ClockWidget />

        {/* Nav */}
        <nav className="flex-1 flex flex-col items-center py-2 gap-0.5 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              className={({ isActive }) =>
                clsx(
                  'group relative w-11 h-10 flex items-center justify-center rounded-xl transition-all duration-150',
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-900/40'
                    : 'text-zinc-500 hover:bg-white/10 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? 'text-white' : ''} />
                  {/* Tooltip */}
                  <span className="absolute left-[calc(100%+10px)] px-2.5 py-1.5 bg-zinc-800 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl border border-white/10">
                    {label}
                    <span className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-2.5 h-2.5 bg-zinc-800 border-l border-b border-white/10 rotate-45" />
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Pricing badge */}
        <div className="shrink-0 border-t border-white/10 py-3 px-1 flex flex-col items-center">
          <span className="text-[9px] font-black text-brand-400 uppercase tracking-wider leading-none">FREE</span>
          <span className="text-[8px] text-zinc-600 line-through leading-none mt-0.5">$400/yr</span>
        </div>
      </aside>

      {/* Mobile: full sidebar slides in */}
      <aside
        className={clsx(
          'fixed lg:hidden inset-y-0 left-0 z-30 flex flex-col w-64 bg-zinc-950 border-r border-white/10 transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <LogoFull className="h-8 w-auto" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-900/40'
                    : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                )
              }
            >
              <Icon size={17} className="shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Pricing */}
        <div className="px-4 py-4 border-t border-white/10 shrink-0">
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-xs font-black text-white uppercase tracking-wide">Lifetime Free</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              <span className="line-through">$400 CAD/year</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
