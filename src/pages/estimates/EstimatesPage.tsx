import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/services/api';
import { Estimate, Customer, EstimateStatus } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ESTIMATE_STATUSES: EstimateStatus[] = ['DRAFT', 'SENT', 'APPROVED', 'DECLINED', 'EXPIRED'];

const estimateSchema = z.object({
  customerId: z.string().min(1, 'Customer required'),
  vehicleId: z.string().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
});

type EstimateForm = z.infer<typeof estimateSchema>;

interface NewEstimateModalProps {
  open: boolean;
  onClose: () => void;
}

function NewEstimateModal({ open, onClose }: NewEstimateModalProps) {
  const qc = useQueryClient();
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const { data: customersRes } = useQuery({
    queryKey: ['customers-search', customerSearch],
    queryFn: () => api.get(`/customers?search=${customerSearch}&limit=20`),
    enabled: open,
  });

  const { data: vehiclesRes } = useQuery({
    queryKey: ['vehicles-by-customer', selectedCustomerId],
    queryFn: () => api.get(`/vehicles?customerId=${selectedCustomerId}&limit=100`),
    enabled: !!selectedCustomerId,
  });

  const customers: Customer[] = customersRes?.data.data ?? [];
  const vehicles = vehiclesRes?.data.data ?? [];

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<EstimateForm>({
    resolver: zodResolver(estimateSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: EstimateForm) => api.post('/estimates', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estimates'] });
      toast.success('Estimate created');
      reset();
      setSelectedCustomerId('');
      setCustomerSearch('');
      onClose();
    },
    onError: () => toast.error('Failed to create estimate'),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Estimate"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(d => mutation.mutate(d))} disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Creating...' : 'Create Estimate'}
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
          <select
            {...register('customerId')}
            className="input"
            onChange={e => {
              setValue('customerId', e.target.value);
              setSelectedCustomerId(e.target.value);
              setValue('vehicleId', '');
            }}
          >
            <option value="">Select a customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} — {c.phone}
              </option>
            ))}
          </select>
          {errors.customerId && <p className="mt-1 text-xs text-red-500">{errors.customerId.message}</p>}
        </div>
        <div>
          <label className="label">Vehicle (optional)</label>
          <select {...register('vehicleId')} className="input" disabled={!selectedCustomerId}>
            <option value="">Select a vehicle</option>
            {vehicles.map((v: { id: string; year: number; make: string; model: string; licensePlate?: string }) => (
              <option key={v.id} value={v.id}>
                {v.year} {v.make} {v.model} {v.licensePlate ? `— ${v.licensePlate}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Expiry Date</label>
          <input {...register('expiryDate')} type="date" className="input" />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea {...register('notes')} rows={3} className="input resize-none" placeholder="Estimate notes..." />
        </div>
      </form>
    </Modal>
  );
}

export default function EstimatesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['estimates', search, statusFilter, page],
    queryFn: () => api.get(`/estimates?search=${search}&status=${statusFilter}&page=${page}&limit=20`),
    placeholderData: prev => prev,
  });

  const convertMutation = useMutation({
    mutationFn: (estimateId: string) => api.post(`/estimates/${estimateId}/convert-to-ro`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['estimates'] });
      qc.invalidateQueries({ queryKey: ['repair-orders'] });
      toast.success('Estimate converted to repair order');
    },
    onError: () => toast.error('Failed to convert estimate'),
  });

  const estimates: Estimate[] = data?.data.data ?? [];
  const pagination = data?.data.pagination;

  return (
    <div>
      <PageHeader
        title="Estimates"
        description="Manage customer estimates"
        actions={
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> New Estimate
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
              placeholder="Search estimates..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="input max-w-[160px]"
          >
            <option value="">All Statuses</option>
            {ESTIMATE_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner fullPage />
        ) : estimates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No estimates found"
            description="Create your first estimate to get started"
            action={
              <button onClick={() => setModalOpen(true)} className="btn-primary">
                <Plus size={16} /> New Estimate
              </button>
            }
          />
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estimate #</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Expiry</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Lines</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Created</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {estimates.map(est => (
                  <tr key={est.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/estimates/${est.id}`} className="text-sm font-semibold text-brand-600 hover:underline">
                        {est.estimateNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {est.customer ? `${est.customer.firstName} ${est.customer.lastName}` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={est.status} />
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">
                      {est.expiryDate ? format(new Date(est.expiryDate), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-center text-sm text-gray-500 dark:text-gray-400">
                      {(est.laborLines?.length ?? 0) + (est.partsLines?.length ?? 0)}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(est.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      {est.status === 'APPROVED' && (
                        <button
                          onClick={() => convertMutation.mutate(est.id)}
                          disabled={convertMutation.isPending}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 px-2 py-1 rounded hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors"
                        >
                          <ArrowRight size={13} /> Convert to RO
                        </button>
                      )}
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

      <NewEstimateModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
