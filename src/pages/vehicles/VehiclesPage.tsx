import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Car, ClipboardList, Loader2, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/services/api';
import { Vehicle, Customer } from '@/types';
import { decodeVIN, pickVehicleBasics, pickVehicleSpecs, VehicleSpec } from '@/utils/vinDecode';
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
  engineSize: z.string().optional(),
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

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, reset } = useForm<VehicleForm>({
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
          engineSize: vehicle.engineSize ?? '',
          mileage: vehicle.mileage,
        }
      : { year: new Date().getFullYear() },
  });

  const vin = watch('vin');
  const [vinStatus, setVinStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [decodedVin, setDecodedVin] = useState<string | null>(null);
  // Read-only extras from the same decode response - shown in this modal so
  // the full spec sheet is visible before the vehicle is ever saved. Only the
  // four fields pickVehicleBasics fills are persisted; these are display only.
  const [specs, setSpecs] = useState<VehicleSpec[]>([]);

  useEffect(() => {
    const cleanVin = (vin ?? '').trim().toUpperCase();
    if (cleanVin.length !== 17 || cleanVin === decodedVin) {
      if (cleanVin.length !== 17) {
        setVinStatus('idle');
        // Functional update so clearing an already-empty list can't queue a
        // pointless re-render on every keystroke.
        setSpecs(prev => (prev.length ? [] : prev));
      }
      return;
    }

    let cancelled = false;
    setVinStatus('loading');
    decodeVIN(cleanVin)
      .then(results => {
        if (cancelled) return;
        const basics = pickVehicleBasics(results);
        if (!basics.make && !basics.model && !basics.year) {
          setVinStatus('error');
          setSpecs(prev => (prev.length ? [] : prev));
          return;
        }
        if (basics.make) setValue('make', basics.make, { shouldValidate: true });
        if (basics.model) setValue('model', basics.model, { shouldValidate: true });
        if (basics.year) setValue('year', basics.year, { shouldValidate: true });
        if (basics.engineSize) setValue('engineSize', basics.engineSize);
        setSpecs(pickVehicleSpecs(results));
        setDecodedVin(cleanVin);
        setVinStatus('done');
      })
      .catch(() => {
        if (cancelled) return;
        setVinStatus('error');
        setSpecs(prev => (prev.length ? [] : prev));
      });

    return () => { cancelled = true; };
  }, [vin, decodedVin, setValue]);

  const mutation = useMutation({
    mutationFn: (data: VehicleForm) =>
      isEdit ? api.put(`/vehicles/${vehicle!.id}`, data) : api.post('/vehicles', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success(isEdit ? 'Vehicle updated' : 'Vehicle created');
      reset();
      // The modal is keyed 'new', so it stays mounted between consecutive
      // adds. Without clearing these, re-entering the same VIN would match
      // decodedVin and short-circuit the effect - no decode, no specs, no
      // auto-fill badge.
      setDecodedVin(null);
      setSpecs([]);
      setVinStatus('idle');
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
            <label className="label flex items-center gap-1.5">
              VIN
              {vinStatus === 'loading' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-normal text-gray-400 normal-case">
                  <Loader2 size={11} className="animate-spin" /> Decoding...
                </span>
              )}
              {vinStatus === 'done' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-normal text-green-600 dark:text-green-400 normal-case">
                  <CheckCircle2 size={11} /> Auto-filled
                </span>
              )}
              {vinStatus === 'error' && (
                <span className="text-[10px] font-normal text-gray-400 normal-case">Couldn't decode VIN - enter details manually</span>
              )}
            </label>
            <input {...register('vin')} className="input font-mono uppercase tracking-wide" maxLength={17} placeholder="1HGBH41JXMN109186" />
          </div>
          <div>
            <label className="label">License Plate</label>
            <input {...register('licensePlate')} className="input" placeholder="ABC-1234" />
          </div>
        </div>

        {/* Everything the VIN decode returned, not just the four fields written
            into the form above. Read-only and never submitted - it's here so
            the full spec sheet is visible before deciding to save. */}
        {specs.length > 0 && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 px-4 py-3">
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Car size={12} /> Decoded from VIN
              <span className="font-normal normal-case tracking-normal text-gray-400">
                — not saved, for reference only
              </span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-2.5">
              {specs.map(spec => (
                <div key={spec.variable}>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {spec.label}
                  </p>
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200 mt-0.5 break-words">
                    {spec.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
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
        <div>
          <label className="label">Engine Size</label>
          <input {...register('engineSize')} className="input" placeholder="2.0L" />
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

      <div>
        {isLoading ? (
          <div className="card overflow-hidden">
            <LoadingSpinner fullPage />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="card overflow-hidden">
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
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="md:hidden space-y-2.5">
              {vehicles.map(v => (
                <div key={v.id} className="card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Link to={`/vehicles/${v.id}`} className="flex items-center gap-3 group min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                        <Car size={16} className="text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 truncate">
                          {v.year} {v.make} {v.model}
                        </p>
                        {v.color && <p className="text-xs text-gray-400">{v.color}</p>}
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
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
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {v.customer ? `${v.customer.firstName} ${v.customer.lastName}` : '—'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <ClipboardList size={14} className="text-gray-400" />
                      {v._count?.repairOrders ?? 0}
                    </span>
                  </div>
                </div>
              ))}
              {pagination && (
                <div className="card px-4 py-3">
                  <Pagination meta={pagination} onPageChange={setPage} />
                </div>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block card overflow-hidden">
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
                        <ClipboardList size={14} className="text-gray-400" />
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
            </div>
          </>
        )}
      </div>

      <VehicleFormModal
        key={editVehicle?.id ?? 'new'}
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
