import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  LayoutDashboard, Users, Car, FileText, Receipt,
  CreditCard, UserCog, Search, Package, BarChart3, Settings,
  ClipboardList, X, ChevronRight, ChevronLeft, Inbox, Crown, Clock, AlertTriangle,
} from 'lucide-react';
import { LogoIcon, LogoFull } from '@/components/ui/Logo';
import { useAuthStore } from '@/store/auth.store';
import api from '@/services/api';
import { Role, SubscriptionInfo } from '@/types';

const NAV_ITEMS: { to: string; icon: typeof LayoutDashboard; label: string; roles?: Role[] }[] = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/repair-orders',icon: ClipboardList,   label: 'Job Board'    },
  { to: '/estimates',    icon: FileText,        label: 'Estimates'    },
  { to: '/customers',    icon: Users,           label: 'Customers'    },
  { to: '/vehicles',     icon: Car,             label: 'Vehicles'     },
  { to: '/invoices',     icon: Receipt,         label: 'Invoices'     },
  { to: '/payments',     icon: CreditCard,      label: 'Payments'     },
  { to: '/technicians',  icon: UserCog,         label: 'Technicians'  },
  { to: '/inspections',  icon: Search,          label: 'Inspections'  },
  { to: '/inventory',    icon: Package,         label: 'Inventory'    },
  { to: '/inquiries',    icon: Inbox,           label: 'Inquiries',    roles: ['SHOP_ADMIN', 'MANAGER'] },
  { to: '/reports',      icon: BarChart3,       label: 'Reports'      },
  { to: '/settings',     icon: Settings,        label: 'Settings'     },
];

function ClockWidget({ expanded }: { expanded: boolean }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const hh = now.getHours().toString().padStart(2,'0');
  const mm = now.getMinutes().toString().padStart(2,'0');

  if (expanded) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
        <span className="text-[10px] font-bold text-brand-400 tracking-widest uppercase w-7">
          {days[now.getDay()]}
        </span>
        <span className="text-sm font-bold text-white tabular-nums leading-tight">
          {hh}:{mm}
        </span>
      </div>
    );
  }

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

function getPlanBadgeContent(sub: SubscriptionInfo) {
  if (sub.status === 'TRIAL') {
    return {
      icon: Clock,
      color: 'text-amber-400',
      label: `Trial · ${sub.daysLeft ?? 0}d left`,
      subtext: sub.planType === 'YEARLY' ? '$400/yr after trial' : '$50/mo after trial',
    };
  }
  if (sub.status === 'EXPIRED') {
    return {
      icon: AlertTriangle,
      color: 'text-red-400',
      label: 'Subscription Expired',
      subtext: 'Renew to regain access',
      mailto: true,
    };
  }
  if (sub.planType === 'LIFETIME_FREE') {
    return { icon: Crown, color: 'text-brand-400', label: 'Lifetime Free', subtext: 'Thanks for being an early customer' };
  }
  // ACTIVE (paid Monthly/Yearly)
  return {
    icon: Crown,
    color: 'text-green-400',
    label: sub.planType === 'YEARLY' ? 'Yearly Plan' : 'Monthly Plan',
    subtext: sub.paidUntil ? `Renews ${format(new Date(sub.paidUntil), 'MMM d, yyyy')}` : 'Active',
  };
}

function SubscriptionBadge({ compact }: { compact: boolean }) {
  const { data } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.get<{ success: boolean; data: SubscriptionInfo }>('/settings/subscription'),
  });
  const sub = data?.data.data;
  if (!sub) return null;

  const { icon: Icon, color, label, subtext, mailto } = getPlanBadgeContent(sub);
  const content = mailto ? (
    <a href="mailto:info@autozord.com?subject=Autozord%20Subscription%20Renewal" className="contents">
      <Icon size={compact ? 16 : 13} className={color} />
      {!compact && (
        <div className="min-w-0">
          <p className={clsx('text-[10px] font-black uppercase tracking-wide', color)}>{label}</p>
          <p className="text-[9px] text-zinc-500 mt-0.5 truncate">{subtext}</p>
        </div>
      )}
    </a>
  ) : (
    <>
      <Icon size={compact ? 16 : 13} className={color} />
      {!compact && (
        <div className="min-w-0">
          <p className={clsx('text-[10px] font-black uppercase tracking-wide', color)}>{label}</p>
          <p className="text-[9px] text-zinc-500 mt-0.5 truncate">{subtext}</p>
        </div>
      )}
    </>
  );

  if (compact) {
    return (
      <div title={`${label} — ${subtext}`} className="flex items-center justify-center w-9 h-9 rounded-xl">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-xl p-2.5">
      {content}
    </div>
  );
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

export default function Sidebar({ open, onClose, expanded, onToggleExpand }: SidebarProps) {
  const { user } = useAuthStore();
  const visibleItems = NAV_ITEMS.filter(item => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-20 bg-black/70 lg:hidden" onClick={onClose} />
      )}

      {/* ── Desktop sidebar ── */}
      <aside
        className={clsx(
          'hidden lg:flex flex-col relative bg-zinc-950 border-r border-white/[0.06] shrink-0 z-30 h-screen transition-all duration-200 ease-in-out',
          expanded ? 'w-[220px]' : 'w-[64px]'
        )}
      >
        {/* Logo */}
        <div className={clsx(
          'flex items-center h-14 border-b border-white/10 shrink-0 overflow-hidden transition-all duration-200',
          expanded ? 'justify-start px-4' : 'justify-center'
        )}>
          {expanded ? (
            <LogoFull className="h-8 w-auto" />
          ) : (
            <LogoIcon className="h-9 w-9" />
          )}
        </div>

        {/* Expand / Collapse toggle — straddles the sidebar/content border, level with the header */}
        <button
          onClick={onToggleExpand}
          title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          className="absolute -right-3 top-14 -translate-y-1/2 z-40 w-6 h-6 flex items-center justify-center rounded-full bg-zinc-800 border border-white/10 text-zinc-400 shadow-md hover:bg-zinc-700 hover:text-white transition-colors"
        >
          {expanded ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
        </button>

        {/* Clock */}
        <ClockWidget expanded={expanded} />

        {/* Nav */}
        <nav className={clsx(
          'flex-1 flex flex-col py-2 gap-0.5 overflow-y-auto overflow-x-hidden',
          expanded ? 'px-2' : 'items-center'
        )}>
          {visibleItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              title={expanded ? undefined : label}
              className={({ isActive }) =>
                clsx(
                  'group relative flex items-center rounded-xl transition-all duration-150',
                  expanded
                    ? 'gap-3 px-3 py-2.5 text-sm font-medium w-full'
                    : 'w-11 h-10 justify-center',
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-900/40'
                    : 'text-zinc-500 hover:bg-white/10 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={clsx('shrink-0', isActive ? 'text-white' : '')} />
                  {expanded && (
                    <span className={clsx('truncate', isActive ? 'text-white' : '')}>{label}</span>
                  )}
                  {/* Tooltip — only shown when collapsed */}
                  {!expanded && (
                    <span className="absolute left-[calc(100%+10px)] px-2.5 py-1.5 bg-zinc-800 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl border border-white/10">
                      {label}
                      <span className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-2.5 h-2.5 bg-zinc-800 border-l border-b border-white/10 rotate-45" />
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Subscription status */}
        <div className={clsx(
          'shrink-0 border-t border-white/10 py-3 flex flex-col',
          expanded ? 'px-3' : 'items-center'
        )}>
          <SubscriptionBadge compact={!expanded} />
        </div>
      </aside>

      {/* ── Mobile sidebar (unchanged full slide-over) ── */}
      <aside
        className={clsx(
          'fixed lg:hidden inset-y-0 left-0 z-30 flex flex-col w-64 bg-zinc-950 border-r border-white/10 transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-white/10 shrink-0">
          <LogoFull className="h-8 w-auto" />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {visibleItems.map(({ to, icon: Icon, label }) => (
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

        <div className="px-4 py-4 border-t border-white/10 shrink-0">
          <SubscriptionBadge compact={false} />
        </div>
      </aside>
    </>
  );
}
