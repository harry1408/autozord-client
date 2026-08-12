import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Users, ClipboardList, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/services/api';
import { Technician } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

const technicianSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  specializations: z.string().optional(),
  hourlyRate: z.coerce.number().min(0, 'Hourly rate must be non-negative'),
});

type TechnicianForm = z.infer<typeof technicianSchema>;

interface NewTechnicianModalProps {
  open: boolean;
  onClose: () => void;
}

function NewTechnicianModal({ open, onClose }: NewTechnicianModalProps) {
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<TechnicianForm>({
    resolver: zodResolver(technicianSchema),
    defaultValues: { hourlyRate: 25 },
  });

  const mutation = useMutation({
    mutationFn: (data: TechnicianForm) => api.post('/technicians', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['technicians'] });
      toast.success('Technician created');
      reset();
      onClose();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create technician';
      toast.error(msg);
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Technician"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(d => mutation.mutate(d))} disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Creating...' : 'Create Technician'}
          </button>
        </>
      }
    >
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">First Name *</label>
            <input {...register('firstName')} className="input" placeholder="Jane" />
            {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input {...register('lastName')} className="input" placeholder="Smith" />
            {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
          </div>
        </div>
        <div>
          <label className="label">Email *</label>
          <input {...register('email')} type="email" className="input" placeholder="jane.smith@shop.com" />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Password *</label>
          <input {...register('password')} type="password" className="input" placeholder="Min. 6 characters" />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>
        <div>
          <label className="label">Specializations</label>
          <input
            {...register('specializations')}
            className="input"
            placeholder="Engine, Transmission, Brakes"
          />
          <p className="mt-1 text-xs text-gray-400">Comma-separated list of specializations</p>
        </div>
        <div>
          <label className="label">Hourly Rate ($)</label>
          <input {...register('hourlyRate')} type="number" step="0.50" className="input" placeholder="25.00" />
          {errors.hourlyRate && <p className="mt-1 text-xs text-red-500">{errors.hourlyRate.message}</p>}
        </div>
      </form>
    </Modal>
  );
}

interface TechnicianWithActiveROs extends Technician {
  _count?: { repairOrders: number };
}

export default function TechniciansPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['technicians', search, page],
    queryFn: () => api.get(`/technicians?search=${search}&page=${page}&limit=20`),
    placeholderData: prev => prev,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/technicians/${id}`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['technicians'] });
      toast.success('Technician status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/technicians/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['technicians'] });
      toast.success('Technician removed');
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to remove technician'),
  });

  const technicians: TechnicianWithActiveROs[] = data?.data.data ?? [];
  const pagination = data?.data.pagination;

  return (
    <div>
      <PageHeader
        title="Technicians"
        description="Manage your shop technicians"
        actions={
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> New Technician
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
            placeholder="Search technicians..."
          />
        </div>
      </div>

      {isLoading ? (
        <div className="card overflow-hidden">
          <LoadingSpinner fullPage />
        </div>
      ) : technicians.length === 0 ? (
        <div className="card overflow-hidden">
          <EmptyState
            icon={Users}
            title="No technicians found"
            description="Add your first technician to get started"
            action={
              <button onClick={() => setModalOpen(true)} className="btn-primary">
                <Plus size={16} /> Add Technician
              </button>
            }
          />
        </div>
      ) : (
        <>
            {/* Mobile card list */}
            <div className="md:hidden space-y-2.5">
              {technicians.map(tech => (
                <div key={tech.id} className="card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-sm font-semibold text-brand-700 dark:text-brand-400 shrink-0">
                        {tech.user.firstName[0]}{tech.user.lastName[0]}
                      </div>
                      <Link to={`/technicians/${tech.id}`} className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {tech.user.firstName} {tech.user.lastName}
                      </Link>
                    </div>
                    <span className={`badge ${tech.isActive ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'}`}>
                      {tech.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {tech.user.email}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {formatCurrency(tech.hourlyRate)}/hr
                      </span>
                      <button
                        onClick={() => toggleActiveMutation.mutate({ id: tech.id, isActive: !tech.isActive })}
                        disabled={toggleActiveMutation.isPending}
                        className="text-xs font-medium px-2 py-1 rounded transition-colors text-gray-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950"
                      >
                        {tech.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => setDeleteId(tech.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Technician</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Specializations</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Rate</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Active ROs</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {technicians.map(tech => (
                  <tr key={tech.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/technicians/${tech.id}`} className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-sm font-semibold text-brand-700 dark:text-brand-400 shrink-0">
                          {tech.user.firstName[0]}{tech.user.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-600">
                            {tech.user.firstName} {tech.user.lastName}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">
                      {tech.user.email}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-sm text-gray-500 dark:text-gray-400">
                      {tech.specializations
                        ? tech.specializations.split(',').map(s => (
                            <span key={s} className="inline-block mr-1 mb-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
                              {s.trim()}
                            </span>
                          ))
                        : '—'}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-sm text-right text-gray-700 dark:text-gray-300">
                      {formatCurrency(tech.hourlyRate)}/hr
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`badge ${tech.isActive ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'}`}>
                        {tech.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <ClipboardList size={14} className="text-gray-400" />
                        {tech._count?.repairOrders ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleActiveMutation.mutate({ id: tech.id, isActive: !tech.isActive })}
                          disabled={toggleActiveMutation.isPending}
                          className="text-xs font-medium px-2 py-1 rounded transition-colors text-gray-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950"
                        >
                          {tech.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setDeleteId(tech.id)}
                          className="text-xs text-gray-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                        >
                          Remove
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

      <NewTechnicianModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Remove Technician"
        message="Are you sure you want to remove this technician? They will no longer appear in your technician list or be assignable to repair orders. This action cannot be undone."
        confirmLabel="Remove"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
