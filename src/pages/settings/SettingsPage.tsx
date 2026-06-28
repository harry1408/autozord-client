import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Settings, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/services/api';
import { ShopSettings, User, Role } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

const ROLES: Role[] = ['ADMIN', 'MANAGER', 'TECHNICIAN', 'RECEPTIONIST'];

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  MANAGER: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  TECHNICIAN: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  RECEPTIONIST: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
};

const shopSettingsSchema = z.object({
  shopName: z.string().min(1, 'Shop name required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  taxRate: z.coerce.number().min(0).max(100),
  laborRate: z.coerce.number().min(0),
});

type ShopSettingsForm = z.infer<typeof shopSettingsSchema>;

const userSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'TECHNICIAN', 'RECEPTIONIST']),
});

type UserForm = z.infer<typeof userSchema>;

// ─── Shop Profile Tab ──────────────────────────────────────────────────────────

function ShopProfileTab() {
  const qc = useQueryClient();

  const { data: settingsRes, isLoading } = useQuery({
    queryKey: ['shop-settings'],
    queryFn: () => api.get<{ success: boolean; data: ShopSettings }>('/settings'),
  });

  const settings = settingsRes?.data.data;

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ShopSettingsForm>({
    resolver: zodResolver(shopSettingsSchema),
  });

  useEffect(() => {
    if (settings) {
      reset({
        shopName: settings.shopName,
        address: settings.address ?? '',
        phone: settings.phone ?? '',
        email: settings.email ?? '',
        taxRate: settings.taxRate,
        laborRate: settings.laborRate,
      });
    }
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: (data: ShopSettingsForm) => api.put('/settings', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shop-settings'] });
      toast.success('Settings saved');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  if (isLoading) return <LoadingSpinner fullPage />;

  return (
    <div className="card p-6 max-w-2xl">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-6">Shop Profile</h2>
      <form className="space-y-5" onSubmit={handleSubmit(d => mutation.mutate(d))}>
        <div>
          <label className="label">Shop Name *</label>
          <input {...register('shopName')} className="input" placeholder="Auto Care Center" />
          {errors.shopName && <p className="mt-1 text-xs text-red-500">{errors.shopName.message}</p>}
        </div>
        <div>
          <label className="label">Address</label>
          <input {...register('address')} className="input" placeholder="123 Main Street, City, State 12345" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Phone</label>
            <input {...register('phone')} className="input" placeholder="(555) 555-0100" />
          </div>
          <div>
            <label className="label">Email</label>
            <input {...register('email')} type="email" className="input" placeholder="shop@example.com" />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
        </div>
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Default Rates</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tax Rate (%)</label>
              <input {...register('taxRate')} type="number" step="0.01" className="input" placeholder="8.5" />
              {errors.taxRate && <p className="mt-1 text-xs text-red-500">{errors.taxRate.message}</p>}
            </div>
            <div>
              <label className="label">Labor Rate ($/hr)</label>
              <input {...register('laborRate')} type="number" step="0.50" className="input" placeholder="95.00" />
              {errors.laborRate && <p className="mt-1 text-xs text-red-500">{errors.laborRate.message}</p>}
            </div>
          </div>
        </div>
        <div className="pt-2">
          <button
            type="submit"
            disabled={mutation.isPending || !isDirty}
            className="btn-primary"
          >
            {mutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Users Tab ─────────────────────────────────────────────────────────────────

interface NewUserModalProps {
  open: boolean;
  onClose: () => void;
}

function NewUserModal({ open, onClose }: NewUserModalProps) {
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'RECEPTIONIST' },
  });

  const mutation = useMutation({
    mutationFn: (data: UserForm) => api.post('/users', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created');
      reset();
      onClose();
    },
    onError: () => toast.error('Failed to create user'),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create User"
      size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(d => mutation.mutate(d))} disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Creating...' : 'Create User'}
          </button>
        </>
      }
    >
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">First Name *</label>
            <input {...register('firstName')} className="input" placeholder="Jane" />
            {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input {...register('lastName')} className="input" placeholder="Doe" />
            {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
          </div>
        </div>
        <div>
          <label className="label">Email *</label>
          <input {...register('email')} type="email" className="input" placeholder="jane@shop.com" />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Password *</label>
          <input {...register('password')} type="password" className="input" placeholder="Min. 6 characters" />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>
        <div>
          <label className="label">Role *</label>
          <select {...register('role')} className="input">
            {ROLES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}

function UsersTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const qc = useQueryClient();

  const { data: usersRes, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users?limit=100'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/users/${id}`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User status updated');
    },
    onError: () => toast.error('Failed to update user'),
  });

  const users: User[] = usersRes?.data.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500 dark:text-gray-400">{users.length} user{users.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus size={16} /> Create User
        </button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner fullPage />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">User</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Role</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-xs font-semibold text-brand-700 dark:text-brand-400 shrink-0">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user.firstName} {user.lastName}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${ROLE_COLORS[user.role]}`}>{user.role}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`badge ${user.isActive ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: user.id, isActive: !user.isActive })}
                      disabled={toggleActiveMutation.isPending}
                      className="text-xs font-medium px-2 py-1 rounded transition-colors text-gray-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950"
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <NewUserModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'shop-profile', label: 'Shop Profile', icon: Settings },
  { id: 'users', label: 'Users', icon: Users },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('shop-profile');

  return (
    <div>
      <PageHeader title="Settings" description="Manage your shop settings and users" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'shop-profile' && <ShopProfileTab />}
      {activeTab === 'users' && <UsersTab />}
    </div>
  );
}
