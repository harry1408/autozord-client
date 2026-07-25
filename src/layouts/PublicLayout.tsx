import { Link, Outlet, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { LogoFull } from '@/components/ui/Logo';

const NAV_ITEMS = [
  { to: '/shops', label: 'Find a Shop' },
  { to: '/inquiry', label: 'Request a Quote' },
];

export default function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <header className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/shops">
            <LogoFull className="h-7 w-auto" />
          </Link>
          <nav className="flex items-center gap-6">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={clsx(
                  'text-sm font-medium transition-colors',
                  location.pathname === item.to ? 'text-brand-400' : 'text-zinc-400 hover:text-white'
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/login"
              className="text-sm font-medium text-zinc-500 hover:text-white transition-colors"
            >
              Shop Sign In
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
        <Outlet />
      </main>
      <footer className="border-t border-white/5 py-6">
        <p className="text-center text-xs text-zinc-600">Autozord — Repair Shop Management</p>
      </footer>
    </div>
  );
}
