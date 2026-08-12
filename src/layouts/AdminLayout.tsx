import { NavLink, Outlet } from 'react-router-dom';
import { Building2, Users, Inbox, Mail, LogOut, DatabaseBackup } from 'lucide-react';
import { clsx } from 'clsx';
import { LogoFull } from '@/components/ui/Logo';
import { useAuthStore } from '@/store/auth.store';

const NAV_ITEMS = [
  { to: '/admin/shops', icon: Building2, label: 'Shops' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/inquiries', icon: Inbox, label: 'Inquiries' },
  { to: '/admin/emails', icon: Mail, label: 'Email Activity' },
  { to: '/admin/backup', icon: DatabaseBackup, label: 'Backup' },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 overflow-x-hidden">
      <header className="border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <LogoFull className="h-7 w-auto" />
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-400'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800'
                    )
                  }
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {user?.firstName} {user?.lastName}
              <span className="ml-2 badge bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400">
                Global Admin
              </span>
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
