import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { LogoIcon } from '@/components/ui/Logo';
import { useAuthStore } from '@/store/auth.store';
import api from '@/services/api';

// Covers the entire app (sidebar + header + main) whenever the logged-in
// user's shop is PENDING_VERIFICATION - login itself is allowed for that
// status (see server auth.service.ts), but the shop can't be used until
// Global Admin explicitly verifies it. Applies to every role, not just
// SHOP_ADMIN, since shopStatus is attached to any shop-scoped user.
export default function ShopVerificationOverlay() {
  const { user, setUser, refreshToken, logout } = useAuthStore();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  if (user?.shopStatus !== 'PENDING_VERIFICATION') return null;

  const handleRefresh = async () => {
    setChecking(true);
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data);
      if (res.data.data.shopStatus !== 'PENDING_VERIFICATION') {
        toast.success('Your shop is verified!');
      } else {
        toast('Still pending verification - check back soon.');
      }
    } catch {
      toast.error('Could not check verification status');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout', { refreshToken }); } catch {}
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/70 dark:bg-zinc-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-8 text-center">
        <div className="flex justify-center mb-5">
          <LogoIcon size={56} />
        </div>
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Your shop is being verified at our end
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Thanks for signing up. Our team is reviewing your shop's registration and will notify you by email as soon as it's fully verified. You can check back here anytime.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleRefresh}
            disabled={checking}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking…' : 'Check verification status'}
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
