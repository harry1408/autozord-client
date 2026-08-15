import { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Users, Car, ClipboardList, DollarSign, TrendingUp, ShieldCheck, Crown, Image as ImageIcon, X, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/services/api';
import { ShopDetail, ShopLogoHistoryEntry } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const CURRENCY_SYMBOLS: Record<string, string> = { CAD: '$', USD: '$', INR: '₹' };
const REGION_LABELS: Record<string, string> = { CA: 'Canada', US: 'United States', IN: 'India' };

function planLabel(shop: ShopDetail['shop']): string {
  if (shop.planType === 'LIFETIME_FREE') return 'Lifetime Free';
  if (!shop.planType) return '—';
  const period = shop.planType === 'YEARLY' ? '/yr' : '/mo';
  if (shop.currency && shop.subscriptionPrice != null) {
    const symbol = CURRENCY_SYMBOLS[shop.currency] ?? '';
    const region = shop.country ? REGION_LABELS[shop.country] ?? shop.country : null;
    const priceText = `${symbol}${shop.subscriptionPrice.toLocaleString()} ${shop.currency}${period}`;
    return region ? `${shop.planType === 'YEARLY' ? 'Yearly' : 'Monthly'} (${priceText}, ${region})` : `${shop.planType === 'YEARLY' ? 'Yearly' : 'Monthly'} (${priceText})`;
  }
  // Pre-existing shop signed up before regional pricing existed.
  return shop.planType === 'YEARLY' ? 'Yearly ($400/yr CAD)' : 'Monthly ($50/mo CAD)';
}

function LogoPanel({ shopId, shop }: { shopId: string; shop: ShopDetail['shop'] }) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoUrl = shop.settings?.logoUrl;

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['admin-shop', shopId] });
    qc.invalidateQueries({ queryKey: ['admin-shops'] });
    qc.invalidateQueries({ queryKey: ['admin-shop-logo-history', shopId] });
  };

  const { data: historyRes } = useQuery({
    queryKey: ['admin-shop-logo-history', shopId],
    queryFn: () => api.get<{ success: boolean; data: ShopLogoHistoryEntry[] }>(`/admin/shops/${shopId}/logo-history`),
  });
  const history = historyRes?.data.data ?? [];

  const mutation = useMutation({
    mutationFn: (logoUrl: string) => api.put(`/admin/shops/${shopId}`, { logoUrl }),
    onSuccess: () => { invalidateAll(); toast.success('Logo updated'); },
    onError: () => toast.error('Failed to update logo'),
  });

  const restoreMutation = useMutation({
    mutationFn: (historyId: string) => api.post(`/admin/shops/${shopId}/logo-history/${historyId}/restore`),
    onSuccess: () => { invalidateAll(); toast.success('Logo restored'); },
    onError: () => toast.error('Failed to restore logo'),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2 MB'); return; }
    const reader = new FileReader();
    reader.onload = () => mutation.mutate(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="card p-5 mb-8">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-900 shrink-0 overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
          ) : (
            <ImageIcon size={22} className="text-gray-400" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">Shop Logo</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleChange}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={mutation.isPending}
              className="btn-secondary text-xs"
            >
              {mutation.isPending ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={() => mutation.mutate('')}
                disabled={mutation.isPending}
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Remove logo"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Previous Logos</p>
          <div className="flex flex-wrap gap-4">
            {history.map(h => (
              <div key={h.id} className="flex flex-col items-center gap-1.5 w-20">
                <div className="w-14 h-14 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                  <img src={h.logoUrl} alt="Previous logo" className="w-full h-full object-contain p-1" />
                </div>
                <p className="text-[10px] text-gray-400 text-center leading-tight">
                  {format(new Date(h.createdAt), 'MMM d, yyyy')}
                </p>
                <button
                  type="button"
                  onClick={() => restoreMutation.mutate(h.id)}
                  disabled={restoreMutation.isPending}
                  className="flex items-center gap-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50"
                >
                  <RotateCcw size={10} /> Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SubscriptionPanel({ shopId, shop }: { shopId: string; shop: ShopDetail['shop'] }) {
  const qc = useQueryClient();
  const [paidUntil, setPaidUntil] = useState('');

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.put(`/admin/shops/${shopId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-shop', shopId] });
      qc.invalidateQueries({ queryKey: ['admin-shops'] });
      toast.success('Subscription updated');
    },
    onError: () => toast.error('Failed to update subscription'),
  });

  return (
    <div className="card p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Crown size={16} className="text-gray-400" /> Subscription
        </h3>
        <div className="flex items-center gap-2">
          {!shop.isVerified && (
            <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">Pending Verification</span>
          )}
          {shop.planType && (
            <span className="badge bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {planLabel(shop)}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        {shop.trialEndsAt && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Trial Ends</p>
            <p className="text-gray-900 dark:text-gray-100">{format(new Date(shop.trialEndsAt), 'MMM d, yyyy')}</p>
          </div>
        )}
        {shop.paidUntil && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Paid Until</p>
            <p className="text-gray-900 dark:text-gray-100">{format(new Date(shop.paidUntil), 'MMM d, yyyy')}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!shop.isVerified && (
          <button
            onClick={() => mutation.mutate({ isVerified: true })}
            disabled={mutation.isPending}
            className="btn-primary text-xs"
          >
            <ShieldCheck size={13} /> Verify Account
          </button>
        )}
        {shop.planType !== 'LIFETIME_FREE' && (
          <button
            onClick={() => mutation.mutate({ planType: 'LIFETIME_FREE', isVerified: true })}
            disabled={mutation.isPending}
            className="btn-secondary text-xs"
          >
            Grant Lifetime Free
          </button>
        )}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={paidUntil}
            onChange={e => setPaidUntil(e.target.value)}
            className="input text-xs py-1.5"
          />
          <button
            onClick={() => paidUntil && mutation.mutate({ paidUntil })}
            disabled={mutation.isPending || !paidUntil}
            className="btn-secondary text-xs whitespace-nowrap"
          >
            Set Paid Until
          </button>
        </div>
      </div>
    </div>
  );
}

const STAT_CARDS = [
  { key: 'customerCount', label: 'Customers', icon: Users },
  { key: 'vehicleCount', label: 'Vehicles', icon: Car },
  { key: 'repairOrderCount', label: 'Repair Orders', icon: ClipboardList },
  { key: 'openRepairOrderCount', label: 'Open ROs', icon: TrendingUp },
] as const;

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-shop', id],
    queryFn: () => api.get<{ success: boolean; data: ShopDetail }>(`/admin/shops/${id}`),
  });

  const detail = data?.data.data;

  if (isLoading) return <LoadingSpinner fullPage />;
  if (!detail) return null;

  const { shop, users, stats } = detail;

  return (
    <div>
      <Link to="/admin/shops" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-4">
        <ArrowLeft size={15} /> All shops
      </Link>

      <PageHeader
        title={shop.name}
        description={[shop.address, shop.city, shop.state].filter(Boolean).join(', ') || undefined}
      />

      <LogoPanel shopId={shop.id} shop={shop} />

      <SubscriptionPanel shopId={shop.id} shop={shop} />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {STAT_CARDS.map(({ key, label, icon: Icon }) => (
          <div key={key} className="card p-4">
            <Icon size={16} className="text-gray-400 mb-2" />
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{stats[key]}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          </div>
        ))}
        <div className="card p-4">
          <DollarSign size={16} className="text-gray-400 mb-2" />
          <p className="text-2xl font-black text-gray-900 dark:text-gray-100">
            ${stats.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Users ({users.length})</h3>
        </div>
        {/* Mobile card list */}
        <div className="md:hidden space-y-2.5 p-4">
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
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <table className="hidden md:block w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
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
                <td className="px-5 py-3">
                  <span className={`badge ${u.isActive ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
