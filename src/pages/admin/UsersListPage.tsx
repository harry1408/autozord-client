import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, KeyRound, Copy } from 'lucide-react';
import api from '@/services/api';
import { AdminUserSummary } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

function ResetPasswordButton({ userId, email }: { userId: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'auto' | 'custom'>('auto');
  const [customPassword, setCustomPassword] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.post<{ success: boolean; data: { password: string } }>(
      `/admin/users/${userId}/reset-password`,
      mode === 'custom' ? { password: customPassword } : {}
    ),
    onSuccess: (res) => setResult(res.data.data.password),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to reset password';
      toast.error(msg);
    },
  });

  const close = () => {
    setOpen(false);
    setResult(null);
    setMode('auto');
    setCustomPassword('');
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
      >
        <KeyRound size={13} /> Reset Password
      </button>

      <Modal open={open} onClose={close} title="Reset Password" size="sm">
        {result ? (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              New password for <span className="font-medium text-gray-900 dark:text-gray-100">{email}</span>. Share it with them directly — it won't be shown again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-mono text-gray-900 dark:text-gray-100">
                {result}
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(result); toast.success('Copied'); }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Copy size={16} className="text-gray-500" />
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Reset the password for <span className="font-medium text-gray-900 dark:text-gray-100">{email}</span>.
            </p>
            <div className="space-y-2 mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="radio" checked={mode === 'auto'} onChange={() => setMode('auto')} />
                Auto-generate a temporary password
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="radio" checked={mode === 'custom'} onChange={() => setMode('custom')} />
                Set a specific password
              </label>
            </div>
            {mode === 'custom' && (
              <input
                type="text"
                value={customPassword}
                onChange={e => setCustomPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="input w-full mb-4"
              />
            )}
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || (mode === 'custom' && customPassword.length < 6)}
              className="btn-primary w-full text-sm"
            >
              {mutation.isPending ? 'Resetting...' : 'Reset Password'}
            </button>
          </>
        )}
      </Modal>
    </>
  );
}

export default function UsersListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get<{ success: boolean; data: AdminUserSummary[] }>('/admin/users'),
  });

  const users = data?.data.data ?? [];

  return (
    <div>
      <PageHeader title="Users" description="Every user across every shop" />

      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No users yet" />
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden space-y-2.5">
            {users.map(u => (
              <div key={u.id} className="card p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{u.firstName} {u.lastName}</span>
                  <span className="badge bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{u.role}</span>
                </div>
                <div className="flex items-center justify-between gap-3 mt-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{u.email}</span>
                  <span className={`badge ${u.isActive ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                  {u.shop ? (
                    <Link to={`/admin/shops/${u.shop.id}`} className="text-brand-600 hover:underline text-sm">
                      {u.shop.name}
                    </Link>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                  <ResetPasswordButton userId={u.id} email={u.email} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Shop</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{u.firstName} {u.lastName}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="badge bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{u.role}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                    {u.shop ? (
                      <Link to={`/admin/shops/${u.shop.id}`} className="text-brand-600 hover:underline">
                        {u.shop.name}
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`badge ${u.isActive ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <ResetPasswordButton userId={u.id} email={u.email} />
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
