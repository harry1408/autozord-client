import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Mail, DollarSign, Wrench, Tag } from 'lucide-react';
import api from '@/services/api';
import { Technician, RepairOrder } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { format } from 'date-fns';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

export default function TechnicianDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: techRes, isLoading } = useQuery({
    queryKey: ['technicians', id],
    queryFn: () => api.get<{ success: boolean; data: Technician }>(`/technicians/${id}`),
  });

  const { data: rosRes } = useQuery({
    queryKey: ['technicians', id, 'repair-orders'],
    queryFn: () => api.get<{ success: boolean; data: RepairOrder[] }>(`/repair-orders?technicianId=${id}&limit=50`),
    enabled: !!id,
  });

  if (isLoading) return <LoadingSpinner fullPage />;

  const tech = techRes?.data.data;
  if (!tech) return <div className="card p-8 text-center text-gray-500">Technician not found</div>;

  const orders: RepairOrder[] = rosRes?.data.data ?? [];
  const activeOrders = orders.filter(ro => !['CLOSED', 'CANCELLED', 'INVOICED'].includes(ro.status));
  const techName = `${tech.user.firstName} ${tech.user.lastName}`;

  const specializations = tech.specializations
    ? tech.specializations.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={techName}
        breadcrumbs={[{ label: 'Technicians', to: '/technicians' }, { label: techName }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-xl font-bold text-brand-700 dark:text-brand-400">
              {tech.user.firstName[0]}{tech.user.lastName[0]}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">{techName}</h2>
              <span className={`badge mt-1 ${tech.isActive ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'}`}>
                {tech.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={15} className="text-gray-400 shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">{tech.user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <DollarSign size={15} className="text-gray-400 shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">{formatCurrency(tech.hourlyRate)} / hour</span>
            </div>
          </div>

          {specializations.length > 0 && (
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1.5 mb-2">
                <Tag size={13} className="text-gray-400" />
                <p className="text-xs font-medium text-gray-400">Specializations</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {specializations.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-400 rounded text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Stats</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Jobs</span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{orders.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <span className="text-sm text-amber-700 dark:text-amber-400">Active Jobs</span>
              <span className="text-lg font-bold text-amber-700 dark:text-amber-400">{activeOrders.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <span className="text-sm text-green-700 dark:text-green-400">Completed</span>
              <span className="text-lg font-bold text-green-700 dark:text-green-400">
                {orders.filter(ro => ['COMPLETED', 'CLOSED', 'INVOICED'].includes(ro.status)).length}
              </span>
            </div>
          </div>
        </div>

        {/* Active Assignments */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Active Assignments</h2>
          {activeOrders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No active assignments</p>
          ) : (
            <div className="space-y-3">
              {activeOrders.map(ro => (
                <Link
                  key={ro.id}
                  to={`/repair-orders/${ro.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-800 transition-colors group"
                >
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-600">
                      {ro.roNumber}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ro.vehicle ? `${ro.vehicle.year} ${ro.vehicle.make} ${ro.vehicle.model}` : '—'}
                    </p>
                  </div>
                  <StatusBadge status={ro.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full RO History */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Repair Order History</h2>
        </div>
        {orders.length === 0 ? (
          <EmptyState icon={Wrench} title="No repair orders" description="This technician has no assigned repair orders" />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">RO #</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vehicle</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {orders.map(ro => (
                <tr key={ro.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/repair-orders/${ro.id}`} className="text-sm font-semibold text-brand-600 hover:underline">
                      {ro.roNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-700 dark:text-gray-300">
                    {ro.customer ? `${ro.customer.firstName} ${ro.customer.lastName}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {ro.vehicle ? `${ro.vehicle.year} ${ro.vehicle.make} ${ro.vehicle.model}` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={ro.status} />
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(ro.createdAt), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
