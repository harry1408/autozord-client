import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Receipt } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/services/api';
import { Invoice, InvoiceStatus, RepairOrder } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

const INVOICE_STATUSES: InvoiceStatus[] = ['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'VOID'];

const invoiceSchema = z.object({
  repairOrderId: z.string().min(1, 'Repair order required'),
  taxRate: z.coerce.number().min(0).max(100),
  discount: z.coerce.number().min(0),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
});

type InvoiceForm = z.infer<typeof invoiceSchema>;

interface NewInvoiceModalProps {
  open: boolean;
  onClose: () => void;
}

function NewInvoiceModal({ open, onClose }: NewInvoiceModalProps) {
  const qc = useQueryClient();
  const [roSearch, setRoSearch] = useState('');

  const { data: rosRes } = useQuery({
    queryKey: ['repair-orders-completed', roSearch],
    queryFn: () => api.get(`/repair-orders?status=COMPLETED&search=${roSearch}&limit=50`),
    enabled: open,
  });

  const ros: RepairOrder[] = rosRes?.data.data ?? [];

  const { register, handleSubmit, formState: { errors }, reset } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { taxRate: 8.5, discount: 0 },
  });

  const mutation = useMutation({
    mutationFn: (data: InvoiceForm) => api.post('/invoices', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created');
      reset();
      setRoSearch('');
      onClose();
    },
    onError: () => toast.error('Failed to create invoice'),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Invoice"
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit(d => mutation.mutate(d))} disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Creating...' : 'Create Invoice'}
          </button>
        </>
      }
    >
      <form className="space-y-4">
        <div>
          <label className="label">Repair Order *</label>
          <input
            className="input mb-2"
            placeholder="Search completed ROs..."
            value={roSearch}
            onChange={e => setRoSearch(e.target.value)}
          />
          <select {...register('repairOrderId')} className="input">
            <option value="">Select a repair order</option>
            {ros.map(ro => (
              <option key={ro.id} value={ro.id}>
                {ro.roNumber} — {ro.customer ? `${ro.customer.firstName} ${ro.customer.lastName}` : 'Unknown'}
              </option>
            ))}
          </select>
          {errors.repairOrderId && <p className="mt-1 text-xs text-red-500">{errors.repairOrderId.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Tax Rate (%)</label>
            <input {...register('taxRate')} type="number" step="0.01" className="input" placeholder="8.5" />
          </div>
          <div>
            <label className="label">Discount ($)</label>
            <input {...register('discount')} type="number" step="0.01" className="input" placeholder="0.00" />
          </div>
        </div>
        <div>
          <label className="label">Due Date</label>
          <input {...register('dueDate')} type="date" className="input" />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea {...register('notes')} rows={2} className="input resize-none" placeholder="Invoice notes..." />
        </div>
      </form>
    </Modal>
  );
}

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', search, statusFilter, page],
    queryFn: () => api.get(`/invoices?search=${search}&status=${statusFilter}&page=${page}&limit=20`),
    placeholderData: prev => prev,
  });

  const invoices: Invoice[] = data?.data.data ?? [];
  const pagination = data?.data.pagination;

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Manage customer invoices"
        actions={
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} /> New Invoice
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
              placeholder="Search invoices..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="input max-w-[180px]"
          >
            <option value="">All Statuses</option>
            {INVOICE_STATUSES.map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <LoadingSpinner fullPage />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No invoices found"
            description="Create an invoice from a completed repair order"
            action={
              <button onClick={() => setModalOpen(true)} className="btn-primary">
                <Plus size={16} /> New Invoice
              </button>
            }
          />
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Invoice #</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Customer</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Paid</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Balance</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/invoices/${inv.id}`} className="text-sm font-semibold text-brand-600 hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {inv.customer ? `${inv.customer.firstName} ${inv.customer.lastName}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 dark:text-gray-100">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right hidden md:table-cell text-green-600 dark:text-green-400">
                      {formatCurrency(inv.amountPaid)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right hidden md:table-cell font-medium text-red-600 dark:text-red-400">
                      {inv.balance > 0 ? formatCurrency(inv.balance) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-sm text-gray-500 dark:text-gray-400">
                      {inv.dueDate ? format(new Date(inv.dueDate), 'MMM d, yyyy') : '—'}
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

      <NewInvoiceModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
