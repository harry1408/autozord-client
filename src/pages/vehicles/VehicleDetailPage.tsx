import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Car, Hash, Palette, Gauge, User, Wrench } from 'lucide-react';
import api from '@/services/api';
import { Vehicle, RepairOrder } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import VINInspection from '@/components/VINInspection';
import { format } from 'date-fns';

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: vehicleRes, isLoading } = useQuery({
    queryKey: ['vehicles', id],
    queryFn: () => api.get<{ success: boolean; data: Vehicle }>(`/vehicles/${id}`),
  });

  const { data: ordersRes } = useQuery({
    queryKey: ['vehicles', id, 'repair-orders'],
    queryFn: () => api.get<{ success: boolean; data: RepairOrder[] }>(`/repair-orders?vehicleId=${id}&limit=100`),
  });

  if (isLoading) return <LoadingSpinner fullPage />;

  const vehicle = vehicleRes?.data.data;
  if (!vehicle) return <div className="card p-8 text-center text-gray-500">Vehicle not found</div>;

  const orders: RepairOrder[] = ordersRes?.data.data ?? [];
  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={vehicleName}
        breadcrumbs={[
          { label: 'Vehicles', to: '/vehicles' },
          { label: vehicleName },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle Info Card */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
              <Car size={22} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">{vehicleName}</h2>
              <p className="text-xs text-gray-400">Vehicle Details</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            {vehicle.vin && (
              <div className="flex items-center gap-3 text-sm">
                <Hash size={15} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">VIN</p>
                  <p className="font-mono text-gray-700 dark:text-gray-300">{vehicle.vin}</p>
                </div>
              </div>
            )}
            {vehicle.licensePlate && (
              <div className="flex items-center gap-3 text-sm">
                <Car size={15} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">License Plate</p>
                  <p className="text-gray-700 dark:text-gray-300">{vehicle.licensePlate}</p>
                </div>
              </div>
            )}
            {vehicle.color && (
              <div className="flex items-center gap-3 text-sm">
                <Palette size={15} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Color</p>
                  <p className="text-gray-700 dark:text-gray-300">{vehicle.color}</p>
                </div>
              </div>
            )}
            {vehicle.mileage != null && (
              <div className="flex items-center gap-3 text-sm">
                <Gauge size={15} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Mileage</p>
                  <p className="text-gray-700 dark:text-gray-300">{vehicle.mileage.toLocaleString()} mi</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 mb-1">Added</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {format(new Date(vehicle.createdAt), 'MMMM d, yyyy')}
            </p>
          </div>
        </div>

        {/* Customer Card */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Owner</h2>
          {vehicle.customer ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-sm font-semibold text-brand-700 dark:text-brand-400 shrink-0">
                {vehicle.customer.firstName[0]}{vehicle.customer.lastName[0]}
              </div>
              <div>
                <Link
                  to={`/customers/${vehicle.customerId}`}
                  className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-brand-600"
                >
                  {vehicle.customer.firstName} {vehicle.customer.lastName}
                </Link>
                <p className="text-xs text-gray-400">{vehicle.customer.phone}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-gray-400">
              <User size={16} />
              <span className="text-sm">No customer linked</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Stats</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{orders.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Repair Orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* VIN Inspection */}
      <VINInspection vin={vehicle.vin} />

      {/* Repair History */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Repair History</h2>
        </div>
        {orders.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No repair orders"
            description="This vehicle has no repair orders yet"
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">RO #</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Promised</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Mileage In</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {orders.map(ro => (
                <tr key={ro.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      to={`/repair-orders/${ro.id}`}
                      className="text-sm font-semibold text-brand-600 hover:underline"
                    >
                      {ro.roNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={ro.status} />
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">
                    {ro.promisedDate ? format(new Date(ro.promisedDate), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-sm text-gray-500 dark:text-gray-400">
                    {ro.mileageIn != null ? ro.mileageIn.toLocaleString() + ' mi' : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
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
