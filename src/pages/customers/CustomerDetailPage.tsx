import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Phone, Mail, MapPin, Car, Wrench, Edit } from 'lucide-react';
import api from '@/services/api';
import { Customer, Vehicle, RepairOrder } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import { format } from 'date-fns';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: customerRes, isLoading } = useQuery({
    queryKey: ['customers', id],
    queryFn: () => api.get<{ success: boolean; data: Customer & { vehicles: Vehicle[] } }>(`/customers/${id}`),
  });

  const { data: ordersRes } = useQuery({
    queryKey: ['customers', id, 'repair-orders'],
    queryFn: () => api.get<{ success: boolean; data: RepairOrder[] }>(`/customers/${id}/repair-orders`),
  });

  if (isLoading) return <LoadingSpinner fullPage />;

  const customer = customerRes?.data.data;
  if (!customer) return <div className="card p-8 text-center text-gray-500">Customer not found</div>;

  const vehicles = customer.vehicles ?? [];
  const orders = ordersRes?.data.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${customer.firstName} ${customer.lastName}`}
        breadcrumbs={[{ label: 'Customers', to: '/customers' }, { label: `${customer.firstName} ${customer.lastName}` }]}
        actions={
          <Link to={`/customers`} className="btn-secondary">
            <Edit size={16} /> Edit
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Contact Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Phone size={16} className="text-gray-400 shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-gray-400 shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{customer.email}</span>
              </div>
            )}
            {(customer.address || customer.city) && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                <div className="text-gray-700 dark:text-gray-300">
                  {customer.address && <p>{customer.address}</p>}
                  {[customer.city, customer.state, customer.zip].filter(Boolean).join(', ') && (
                    <p>{[customer.city, customer.state, customer.zip].filter(Boolean).join(', ')}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          {customer.notes && (
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{customer.notes}</p>
            </div>
          )}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{vehicles.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Vehicles</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{orders.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Repair Orders</p>
            </div>
          </div>
        </div>

        {/* Vehicles */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Vehicles</h2>
            <Link to={`/vehicles?customerId=${id}`} className="text-xs text-brand-600 hover:underline font-medium">View all</Link>
          </div>
          {vehicles.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No vehicles</p>
          ) : (
            <div className="space-y-3">
              {vehicles.map((v) => (
                <Link key={v.id} to={`/vehicles/${v.id}`} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-800 transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                    <Car size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-brand-600">
                      {v.year} {v.make} {v.model}
                    </p>
                    <p className="text-xs text-gray-400">{v.licensePlate ?? v.vin ?? 'No plate/VIN'}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Repair History</h2>
            <Link to={`/repair-orders?customerId=${id}`} className="text-xs text-brand-600 hover:underline font-medium">View all</Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No repair orders</p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((ro) => (
                <Link key={ro.id} to={`/repair-orders/${ro.id}`} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-800 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center shrink-0">
                      <Wrench size={14} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-600">{ro.roNumber}</p>
                      <p className="text-xs text-gray-400">{format(new Date(ro.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <StatusBadge status={ro.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
