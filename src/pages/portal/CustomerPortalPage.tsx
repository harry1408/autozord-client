import { LogOut } from 'lucide-react';
import { LogoFull } from '@/components/ui/Logo';
import { useAuthStore } from '@/store/auth.store';

export default function CustomerPortalPage() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 px-6 text-center">
      <LogoFull className="h-12 w-auto mb-8" />
      <h1 className="text-2xl font-black text-white mb-2">Welcome, {user?.firstName}</h1>
      <p className="text-zinc-400 text-sm max-w-sm mb-8">
        The customer portal — browsing shops and tracking inquiries — is coming soon.
      </p>
      <button
        onClick={logout}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <LogOut size={16} /> Sign out
      </button>
    </div>
  );
}
