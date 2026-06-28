import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Car, Wrench } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/services/api';
import { Vehicle, Customer } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

const vehicleSchema = z.object({
  customerId: z.string().min(1, 'Customer required'),
  make: z.string().min(1, 'Make required'),
  model: z.string().min(1, 'Model required'),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  vin: z.string().optional(),
  licensePlate: z.string().optional(),
  color: z.string().optional(),
  mileage: z.coerce.number().min(0).optional(),
});

type VehicleForm = z.infer<typeof vehicleSchema>;

interface VehicleFormModalProps {
  open: boolean;
  onClose: () => void;
  vehicle?: Vehicle;
}

function VehicleFormModal({ open, onClose, vehicle }: VehicleFormModalProps) {
  const qc = useQueryClient();
  const isEdit = !!vehicle;
  const [customerSearch, setCustomerSearch] = useState('');

  const { data: customersRes } = useQuery({
    queryKey: ['customers-search', customerSearch],
    queryFn: () => api.get(`/customers?search=${customerSearch}&limit=20`),
    enabled: open,
  });

  const customers: Customer[] = customersRes?.data.data ?? [];

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: vehicle
      ? {
          customerId: vehicle.customerId,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          vin: vehicle.vin ?? '',
          licensePlate: vehicle.licensePlate ?? '',
          color: vehicle.color ?? '',
          mileage: vehicle.mileage,
        }
      : { year: new Date().getFullYear() },
  });

  const mutation = useMutation({
    mutationFn: (data: VehicleForm) =>
      isEdit ? api.put(`/vehicles/${vehicle!.id}`, data) : api.post('/vehicles', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success(isEdit ? 'Vehicle updated' : 'Vehicle created');
      reset();
      onClose();
    },
    onError: () => toast.error('Failed to save vehicle'),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Vehicle' : 'New Vehicle'}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit(d => mutation.mutate(d))}
            disabled={isSubmitting || mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Vehicle'}
          </button>
        </>
      }
    >
      <form className="space-y-4">
        <div>
          <label className="label">Customer *</label>
          <input
            className="input mb-2"
            placeholder="Search customers..."
            value={customerSearch}
            onChange={e => setCustomerSearch(e.target.value)}
          />
          <select {...register('customerId')} className="input">
            <option value="">Select a customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} — {c.phone}
              </option>
            ))}
          </select>
          {errors.customerId && <p className="mt-1 text-xs text-red-500">{errors.customerId.message}</p>}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Year *</label>
            <input {...register('year')} type="number" className="input" placeholder="2024" />
            {errors.year && <p className="mt-1 text-xs text-red-500">{errors.year.message}</p>}
          </div>
          <div>
            <label className="label">Make *</label>
            <input {...register('make')} className="input" placeholder="Toyota" />
            {errors.make && <p className="mt-1 text-xs text-red-500">{errors.make.message}</p>}
          </div>
          <div>
            <label className="label">Model *</label>
            <input {...register('model')} className="input" placeholder="Camry" />
            {errors.model && <p className="mt-1 text-xs text-red-500">{errors.model.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">VIN</label>
            <input {...register('vin')} className="input" placeholder="1HGBH41JXMN109186" />
          </div>
          <div>
            <label className="label">License Plate</label>
            <input {...register('licensePlate')} className="input" placeholder="ABC-1234" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Color</label>
            <input {...register('color')} className="input" placeholder="Silver" />
          </div>
          <div>
            <label className="label">Mileage</label>
            <input {...register('mileage')} type="number" className="input" placeholder="45000" />
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function VehiclesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', search, page],
    queryFn: () => api.get(`/vehicles?search=${search}&page=${page}&limit=20`),
    placeholderData: prev => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle deleted');
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete vehicle'),
  });

  const vehicles: Vehicle[] = data?.data.data ?? [];
  const pagination = data?.data.pagination;

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Manage customer vehicles"
        actions={
          <button
            onClick={() => { setEditVehicle(undefined); setModalOpen(true); }}
            className="btn-primary"
          >
            <Plus size={16} /> New Vehicle
          </button>
        }
      />

      <div className="card p-4 mb-5">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9"
            placeholder="Search by make, model, VIN, or plate..."
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner fullPage />
        ) : vehicles.length === 0 ? (
          <EmptyState
            icon={Car}
            title="No vehicles found"
            description={search ? `No vehicles match "${search}"` : 'Add your first vehicle to get started'}
            action={
              !search && (
                <button onClick={() => setModalOpen(true)} className="btn-primary">
                  <Plus size={16} /> Add Vehicle
                </button>
              )
            }
          />
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vehicle</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">VIN</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Plate</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Mileage</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">ROs</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/vehicles/${v.id}`} className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                          <Car size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-600">
                            {v.year} {v.make} {v.model}
                          </p>
                          {v.color && <p className="text-xs text-gray-400">{v.color}</p>}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {v.vin ?? '—'}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">
                      {v.licensePlate ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      {v.customer ? (
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {v.customer.firstName} {v.customer.lastName}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-sm text-gray-500 dark:text-gray-400">
                      {v.mileage != null ? v.mileage.toLocaleString() + ' mi' : '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Wrench size={14} className="text-gray-400" />
                        {v._count?.repairOrders ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditVehicle(v); setModalOpen(true); }}
                          className="text-xs text-gray-500 hover:text-brand-600 font-medium px-2 py-1 rounded hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(v.id)}
                          className="text-xs text-gray-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      <VehicleFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        vehicle={editVehicle}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Vehicle"
        message="Are you sure you want to delete this vehicle? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
