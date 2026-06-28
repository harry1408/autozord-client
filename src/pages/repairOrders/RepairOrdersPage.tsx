import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Wrench, LayoutGrid, List } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/services/api';
import { RepairOrder, Customer, Vehicle, ROStatus } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const RO_STATUSES: ROStatus[] = [
  'ESTIMATE', 'APPROVED', 'IN_PROGRESS', 'WAITING_PARTS',
  'QUALITY_CHECK', 'COMPLETED', 'INVOICED', 'CLOSED', 'CANCELLED',
];

const KANBAN_COLUMNS: { status: ROStatus; label: string; color: string; dot: string }[] = [
  { status: 'ESTIMATE',      label: 'Estimate',       color: 'border-t-slate-400',   dot: 'bg-slate-400'   },
  { status: 'APPROVED',      label: 'Approved',       color: 'border-t-blue-500',    dot: 'bg-blue-500'    },
  { status: 'IN_PROGRESS',   label: 'In Progress',    color: 'border-t-amber-500',   dot: 'bg-amber-500'   },
  { status: 'WAITING_PARTS', label: 'Waiting Parts',  color: 'border-t-orange-500',  dot: 'bg-orange-500'  },
  { status: 'QUALITY_CHECK', label: 'QC',             color: 'border-t-purple-500',  dot: 'bg-purple-500'  },
  { status: 'COMPLETED',     label: 'Completed',      color: 'border-t-green-500',   dot: 'bg-green-500'   },
];

const roSchema = z.object({
  customerId:    z.string().min(1, 'Customer required'),
  vehicleId:     z.string().min(1, 'Vehicle required'),
  promisedDate:  z.string().optional(),
  mileageIn:     z.coerce.number().min(0).optional(),
  customerNotes: z.string().optional(),
  internalNotes: z.string().optional(),
});
type ROForm = z.infer<typeof roSchema>;

/* ─── New RO Modal ─────────────────────────────────────── */
function NewROModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
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
  const vehicles: Vehicle[] = vehiclesRes?.data.data ?? [];

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<ROForm>({
    resolver: zodResolver(roSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: ROForm) => api.post('/repair-orders', data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['repair-orders'] });
      toast.success('Repair order created');
      reset();
      setSelectedCustomerId('');
      setCustomerSearch('');
      onClose();
      navigate(`/repair-orders/${res.data.data.id}`);
    },
    onError: () => toast.error('Failed to create repair order'),
  });

  return (
    <Modal open={open} onClose={onClose} title="New Repair Order" size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(d => mutation.mutate(d))} disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Creating…' : 'Create RO'}
          </button>
        </>
      }
    >
      <form className="space-y-4">
        <div>
          <label className="label">Customer *</label>
          <input className="input mb-2" placeholder="Search customers…" value={customerSearch}
            onChange={e => setCustomerSearch(e.target.value)} />
          <select {...register('customerId')} className="input"
            onChange={e => { setValue('customerId', e.target.value); setSelectedCustomerId(e.target.value); setValue('vehicleId', ''); }}>
            <option value="">Select a customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.phone}</option>
            ))}
          </select>
          {errors.customerId && <p className="mt-1 text-xs text-red-500">{errors.customerId.message}</p>}
        </div>
        <div>
          <label className="label">Vehicle *</label>
          <select {...register('vehicleId')} className="input" disabled={!selectedCustomerId}>
            <option value="">Select a vehicle</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.year} {v.make} {v.model}{v.licensePlate ? ` — ${v.licensePlate}` : ''}
              </option>
            ))}
          </select>
          {errors.vehicleId && <p className="mt-1 text-xs text-red-500">{errors.vehicleId.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Promised Date</label>
            <input {...register('promisedDate')} type="date" className="input" />
          </div>
          <div>
            <label className="label">Mileage In</label>
            <input {...register('mileageIn')} type="number" className="input" placeholder="45000" />
          </div>
        </div>
        <div>
          <label className="label">Customer Notes</label>
          <textarea {...register('customerNotes')} rows={2} className="input resize-none" placeholder="Customer concerns…" />
        </div>
        <div>
          <label className="label">Internal Notes</label>
          <textarea {...register('internalNotes')} rows={2} className="input resize-none" placeholder="Shop notes…" />
        </div>
      </form>
    </Modal>
  );
}

/* ─── Kanban Card ──────────────────────────────────────── */
function KanbanCard({ ro }: { ro: RepairOrder }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/repair-orders/${ro.id}`)}
      className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-3.5 cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-bold text-brand-600 dark:text-brand-400 group-hover:underline">
          {ro.roNumber}
        </span>
        <StatusBadge status={ro.status} />
      </div>

      {ro.vehicle && (
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
          {ro.vehicle.year} {ro.vehicle.make} {ro.vehicle.model}
        </p>
      )}
      {ro.vehicle?.licensePlate && (
        <p className="text-[10px] text-gray-400 mt-0.5">{ro.vehicle.licensePlate}</p>
      )}

      {ro.customer && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate">
          {ro.customer.firstName} {ro.customer.lastName}
        </p>
      )}

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 dark:border-zinc-700">
        <span className="text-[10px] text-gray-400">
          {format(new Date(ro.createdAt), 'MMM d')}
        </span>
        {ro.technicians && ro.technicians.length > 0 && (
          <div className="flex -space-x-1">
            {ro.technicians.slice(0, 2).map(t => (
              <div
                key={t.technician.user.id}
                title={`${t.technician.user.firstName} ${t.technician.user.lastName}`}
                className="w-5 h-5 rounded-full bg-brand-600 border-2 border-white dark:border-zinc-800 flex items-center justify-center"
              >
                <span className="text-[8px] font-bold text-white">
                  {t.technician.user.firstName[0]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Kanban Board ─────────────────────────────────────── */
function KanbanBoard({ orders }: { orders: RepairOrder[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-220px)]">
      {KANBAN_COLUMNS.map(col => {
        const cards = orders.filter(ro => ro.status === col.status);
        return (
          <div key={col.status} className="flex-shrink-0 w-72">
            <div className={`bg-white dark:bg-zinc-900 rounded-xl border-t-4 ${col.color} border border-gray-200 dark:border-zinc-800 flex flex-col max-h-[calc(100vh-220px)]`}>
              <div className="flex items-center justify-between px-3.5 py-3 border-b border-gray-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 rounded-t-xl z-10">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{col.label}</span>
                </div>
                <span className="text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  {cards.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                {cards.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">No orders</div>
                ) : (
                  cards.map(ro => <KanbanCard key={ro.id} ro={ro} />)
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────── */
export default function RepairOrdersPage() {
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage]               = useState(1);
  const [modalOpen, setModalOpen]     = useState(false);
  const [view, setView]               = useState<'list' | 'kanban'>('kanban');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('new') === '1') setModalOpen(true);
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['repair-orders', search, statusFilter, page, view],
    queryFn: () =>
      view === 'kanban'
        ? api.get('/repair-orders?limit=200')
        : api.get(`/repair-orders?search=${search}&status=${statusFilter}&page=${page}&limit=20`),
    placeholderData: prev => prev,
  });

  const orders: RepairOrder[] = data?.data.data ?? [];
  const pagination = data?.data.pagination;

  return (
    <div>
      <PageHeader
        title="Job Board"
        description="Track all repair work"
        actions={
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-lg p-1 gap-1">
              <button
                onClick={() => setView('kanban')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  view === 'kanban'
                    ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <LayoutGrid size={13} /> Board
              </button>
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  view === 'list'
                    ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <List size={13} /> List
              </button>
            </div>
            <button onClick={() => setModalOpen(true)} className="btn-primary">
              <Plus size={15} /> New RO
            </button>
          </div>
        }
      />

      {/* Filters — list view only */}
      {view === 'list' && (
        <div className="card p-4 mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="input pl-9"
                placeholder="Search by RO#, customer, or vehicle…"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="input max-w-[200px]"
            >
              <option value="">All Statuses</option>
              {RO_STATUSES.map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No repair orders found"
          description="Create your first repair order to get started"
          action={
            <button onClick={() => setModalOpen(true)} className="btn-primary">
              <Plus size={15} /> New RO
            </button>
          }
        />
      ) : view === 'kanban' ? (
        <KanbanBoard orders={orders} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-800">
                {['RO #','Customer','Vehicle','Status','Technician','Promised','Created'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {orders.map(ro => (
                <tr key={ro.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link to={`/repair-orders/${ro.id}`} className="text-sm font-bold text-brand-600 hover:underline">
                      {ro.roNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                    {ro.customer ? `${ro.customer.firstName} ${ro.customer.lastName}` : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                    {ro.vehicle ? `${ro.vehicle.year} ${ro.vehicle.make} ${ro.vehicle.model}` : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={ro.status} />
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                    {ro.technicians && ro.technicians.length > 0
                      ? ro.technicians.map(t => `${t.technician.user.firstName} ${t.technician.user.lastName}`).join(', ')
                      : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                    {ro.promisedDate ? format(new Date(ro.promisedDate), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(ro.createdAt), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination && view === 'list' && (
            <div className="px-5 border-t border-gray-200 dark:border-zinc-800">
              <Pagination meta={pagination} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}

      <NewROModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
