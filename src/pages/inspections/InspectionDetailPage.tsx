import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import api from '@/services/api';
import { Inspection, InspectionItem, ItemStatus } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ITEM_STATUS_CONFIG: Record<ItemStatus, { label: string; icon: typeof CheckCircle; classes: string; buttonClass: string }> = {
  OK: {
    label: 'OK',
    icon: CheckCircle,
    classes: 'text-green-600 dark:text-green-400',
    buttonClass: 'border-green-400 bg-green-50 text-green-700 dark:bg-green-950 dark:border-green-700 dark:text-green-400',
  },
  ATTENTION: {
    label: 'Attention',
    icon: AlertTriangle,
    classes: 'text-amber-600 dark:text-amber-400',
    buttonClass: 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-400',
  },
  CRITICAL: {
    label: 'Critical',
    icon: XCircle,
    classes: 'text-red-600 dark:text-red-400',
    buttonClass: 'border-red-400 bg-red-50 text-red-700 dark:bg-red-950 dark:border-red-700 dark:text-red-400',
  },
};

function ItemStatusButton({ status, current, onClick }: { status: ItemStatus; current: ItemStatus; onClick: () => void }) {
  const config = ITEM_STATUS_CONFIG[status];
  const Icon = config.icon;
  const isActive = status === current;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
        isActive
          ? config.buttonClass + ' border-2'
          : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <Icon size={13} />
      {config.label}
    </button>
  );
}

export default function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: inspRes, isLoading } = useQuery({
    queryKey: ['inspections', id],
    queryFn: () => api.get<{ success: boolean; data: Inspection }>(`/inspections/${id}`),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, status, notes }: { itemId: string; status: ItemStatus; notes?: string }) =>
      api.patch(`/inspections/${id}/items/${itemId}`, { status, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inspections', id] });
    },
    onError: () => toast.error('Failed to update item'),
  });

  const completeMutation = useMutation({
    mutationFn: () => api.patch(`/inspections/${id}/status`, { status: 'COMPLETED' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inspections', id] });
      toast.success('Inspection marked as completed');
    },
    onError: () => toast.error('Failed to complete inspection'),
  });

  if (isLoading) return <LoadingSpinner fullPage />;

  const insp = inspRes?.data.data;
  if (!insp) return <div className="card p-8 text-center text-gray-500">Inspection not found</div>;

  const items = insp.items ?? [];
  const okCount = items.filter(i => i.status === 'OK').length;
  const attnCount = items.filter(i => i.status === 'ATTENTION').length;
  const critCount = items.filter(i => i.status === 'CRITICAL').length;

  // Group items by category
  const grouped = items.reduce<Record<string, InspectionItem[]>>((acc, item) => {
    const cat = item.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const vehicleName = insp.vehicle
    ? `${insp.vehicle.year} ${insp.vehicle.make} ${insp.vehicle.model}`
    : 'Unknown Vehicle';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Inspection — ${vehicleName}`}
        breadcrumbs={[{ label: 'Inspections', to: '/inspections' }, { label: vehicleName }]}
        actions={
          insp.status === 'IN_PROGRESS' && (
            <button onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending} className="btn-primary">
              {completeMutation.isPending ? 'Completing...' : 'Mark Complete'}
            </button>
          )
        }
      />

      {/* Header Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <StatusBadge status={insp.status} />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Vehicle</p>
              <Link to={`/vehicles/${insp.vehicleId}`} className="text-brand-600 hover:underline font-medium">
                {vehicleName}
              </Link>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Technician</p>
              <p className="text-gray-700 dark:text-gray-300">
                {insp.technician
                  ? `${insp.technician.user.firstName} ${insp.technician.user.lastName}`
                  : 'Unassigned'}
              </p>
            </div>
            {insp.repairOrderId && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Repair Order</p>
                <Link to={`/repair-orders/${insp.repairOrderId}`} className="text-brand-600 hover:underline font-medium">
                  View RO
                </Link>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Date</p>
              <p className="text-gray-700 dark:text-gray-300">
                {format(new Date(insp.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Counts */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
              <CheckCircle size={24} className="text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{okCount}</p>
              <p className="text-xs text-green-600 dark:text-green-500">OK</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30">
              <AlertTriangle size={24} className="text-amber-600 dark:text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{attnCount}</p>
              <p className="text-xs text-amber-600 dark:text-amber-500">Attention</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950/30">
              <XCircle size={24} className="text-red-600 dark:text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{critCount}</p>
              <p className="text-xs text-red-600 dark:text-red-500">Critical</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inspection Items by Category */}
      {Object.keys(grouped).length === 0 ? (
        <div className="card p-8 text-center text-gray-400">No inspection items</div>
      ) : (
        Object.entries(grouped).map(([category, categoryItems]) => (
          <div key={category} className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{category}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{categoryItems.length} items</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {categoryItems.map(item => {
                const currentConfig = ITEM_STATUS_CONFIG[item.status];
                const Icon = currentConfig.icon;
                return (
                  <div key={item.id} className="px-6 py-4">
                    <div className="flex items-start gap-4">
                      <Icon size={18} className={`mt-0.5 shrink-0 ${currentConfig.classes}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{item.name}</p>
                        {/* Status Buttons */}
                        {insp.status === 'IN_PROGRESS' && (
                          <div className="flex gap-2 mb-2">
                            {(['OK', 'ATTENTION', 'CRITICAL'] as ItemStatus[]).map(s => (
                              <ItemStatusButton
                                key={s}
                                status={s}
                                current={item.status}
                                onClick={() => updateItemMutation.mutate({ itemId: item.id, status: s })}
                              />
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.notes}</p>
                        )}
                        {insp.status === 'IN_PROGRESS' && (
                          <input
                            defaultValue={item.notes ?? ''}
                            onBlur={e => {
                              if (e.target.value !== (item.notes ?? '')) {
                                updateItemMutation.mutate({ itemId: item.id, status: item.status, notes: e.target.value });
                              }
                            }}
                            className="mt-2 w-full max-w-md px-2 py-1.5 text-xs bg-transparent border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:border-brand-400 text-gray-600 dark:text-gray-400 placeholder-gray-300 dark:placeholder-gray-600"
                            placeholder="Add notes..."
                          />
                        )}
                      </div>
                      {insp.status === 'COMPLETED' && (
                        <StatusBadge status={item.status} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
