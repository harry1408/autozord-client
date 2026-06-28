import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, ClipboardCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/services/api';
import { Inspection, InspectionStatus, Vehicle, RepairOrder, Technician } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const INSPECTION_STATUSES: InspectionStatus[] = ['IN_PROGRESS', 'COMPLETED'];

const inspectionSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle required'),
  repairOrderId: z.string().optional(),
  technicianId: z.string().optional(),
});

type InspectionForm = z.infer<typeof inspectionSchema>;

interface NewInspectionModalProps {
  open: boolean;
  onClose: () => void;
}

function NewInspectionModal({ open, onClose }: NewInspectionModalProps) {
  const qc = useQueryClient();
  const [vehicleSearch, setVehicleSearch] = useState('');

  const { data: vehiclesRes } = useQuery({
    queryKey: ['vehicles-search', vehicleSearch],
    queryFn: () => api.get(`/vehicles?search=${vehicleSearch}&limit=20`),
    enabled: open,
  });

  const { data: techsRes } = useQuery({
    queryKey: ['technicians-active'],
    queryFn: () => api.get('/technicians?isActive=true&limit=100'),
    enabled: open,
  });

  const { data: rosRes } = useQuery({
    queryKey: ['repair-orders-open'],
    queryFn: () => api.get('/repair-orders?status=IN_PROGRESS&limit=50'),
    enabled: open,
  });

  const vehicles: Vehicle[] = vehiclesRes?.data.data ?? [];
  const techs: Technician[] = techsRes?.data.data ?? [];
  const ros: RepairOrder[] = rosRes?.data.data ?? [];

  const { register, handleSubmit, formState: { errors }, reset } = useForm<InspectionForm>({
    resolver: zodResolver(inspectionSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: InspectionForm) => api.post('/inspections', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inspections'] });
      toast.success('Inspection created');
      reset();
      setVehicleSearch('');
      onClose();
    },
    onError: () => toast.error('Failed to create inspection'),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Inspection"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(d => mutation.mutate(d))} disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Creating...' : 'Create Inspection'}
          </button>
        </>
      }
    >
      <form className="space-y-4">
        <div>
          <label className="label">Vehicle *</label>
          <input
            className="input mb-2"
            placeholder="Search vehicles..."
            value={vehicleSearch}
            onChange={e => setVehicleSearch(e.target.value)}
          />
          <select {...register('vehicleId')} className="input">
            <option value="">Select a vehicle</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.year} {v.make} {v.model} {v.licensePlate ? `— ${v.licensePlate}` : ''}
              </option>
            ))}
          </select>
          {errors.vehicleId && <p className="mt-1 text-xs text-red-500">{errors.vehicleId.message}</p>}
        </div>
        <div>
          <label className="label">Repair Order (optional)</label>
          <select {...register('repairOrderId')} className="input">
            <option value="">None</option>
            {ros.map(ro => (
              <option key={ro.id} value={ro.id}>
                {ro.roNumber} — {ro.customer ? `${ro.customer.firstName} ${ro.customer.lastName}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Technician (optional)</label>
          <select {...register('technicianId')} className="input">
            <option value="">Unassigned</option>
            {techs.map(t => (
              <option key={t.id} value={t.id}>
                {t.user.firstName} {t.user.lastName}
              </option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}

export default function InspectionsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['inspections', search, statusFilter, page],
    queryFn: () =>
      api.get(`/inspections?search=${search}&status=${statusFilter}&page=${page}&limit=20`),
    placeholderData: prev => prev,
  });

  const inspections: Inspection[] = data?.data.data ?? [];
  const pagination = data?.data.pagination;

  return (
    <div>
      <PageHeader
        title="Inspections"
        description="Digital vehicle inspections"
        actions={
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> New Inspection
          </button>
        }
      />

      <div className="card p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input pl-9"
              placeholder="Search inspections..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="input max-w-[180px]"
          >
            <option value="">All Statuses</option>
            {INSPECTION_STATUSES.map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner fullPage />
        ) : inspections.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No inspections found"
            description="Start a new digital vehicle inspection"
            action={
              <button onClick={() => setModalOpen(true)} className="btn-primary">
                <Plus size={16} /> New Inspection
              </button>
            }
          />
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vehicle</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">RO Link</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Technician</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Items</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {inspections.map(insp => {
                  const items = insp.items ?? [];
                  const okCount = items.filter(i => i.status === 'OK').length;
                  const attnCount = items.filter(i => i.status === 'ATTENTION').length;
                  const critCount = items.filter(i => i.status === 'CRITICAL').length;
                  return (
                    <tr key={insp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/inspections/${insp.id}`} className="group">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-600">
                            {insp.vehicle
                              ? `${insp.vehicle.year} ${insp.vehicle.make} ${insp.vehicle.model}`
                              : 'Unknown Vehicle'}
                          </p>
                          {insp.vehicle?.vin && (
                            <p className="text-xs text-gray-400 font-mono">{insp.vehicle.vin}</p>
                          )}
                        </Link>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        {insp.repairOrderId ? (
                          <Link to={`/repair-orders/${insp.repairOrderId}`} className="text-xs text-brand-600 hover:underline">
                            View RO
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">
                        {insp.technician
                          ? `${insp.technician.user.firstName} ${insp.technician.user.lastName}`
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={insp.status} />
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-center">
                        {items.length > 0 ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">{okCount} OK</span>
                            {attnCount > 0 && <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{attnCount} Attn</span>}
                            {critCount > 0 && <span className="text-xs text-red-600 dark:text-red-400 font-medium">{critCount} Crit</span>}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">0 items</span>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(insp.createdAt), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {pagination && (
              <div className="px-6 border-t border-gray-200 dark:border-gray-800">
                <Pagination meta={pagination} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>

      <NewInspectionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
