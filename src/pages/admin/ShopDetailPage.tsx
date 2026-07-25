import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users, Car, ClipboardList, DollarSign, TrendingUp } from 'lucide-react';
import api from '@/services/api';
import { ShopDetail } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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
        <table className="w-full text-sm">
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
